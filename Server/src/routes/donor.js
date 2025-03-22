import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import fs from 'fs';
import Papa from 'papaparse';
import xlsx from 'xlsx';
import path from 'path';

/**
 * @module DonorAPI
 * @category Routes
 */

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

/**
 * Helper function to handle BigInt serialization in donor objects
 * @param {Object} donor - The donor object to format
 * @returns {Object} Formatted donor object with stringified ID
 * @private
 */
const formatDonor = (donor) => {
  if (!donor) return null;
  
  // Handle single donor
  if (!Array.isArray(donor)) {
    return {
      ...donor,
      id: donor.id.toString(),
    };
  }
  
  // Handle array of donors
  return donor.map(d => ({
    ...d,
    id: d.id.toString(),
  }));
};

/**
 * Get donors list with pagination, filtering, and sorting
 * 
 * @name GET /api/donors
 * @function
 * @memberof module:DonorAPI
 * @inner
 * @param {string} req.query.page - Page number for pagination (default: 1)
 * @param {string} req.query.limit - Number of donors per page (default: 20)
 * @param {string} req.query.sort - Field to sort by (e.g., "last_name", "total_donations")
 * @param {string} req.query.order - Sort order ("asc" or "desc")
 * @param {string} req.query.pmm - Filter by Prospect Move Manager
 * @param {string} req.query.city - Filter by city
 * @param {string} req.query.excluded - Filter by excluded status (true/false)
 * @param {string} req.query.deceased - Filter by deceased status (true/false)
 * @param {string} req.query.tags - Filter by tags (comma-separated)
 * @param {string} req.query.minDonation - Filter by minimum total donation amount
 * @param {string} req.query.search - Search term for name or organization
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - List of donors with pagination info
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/donors?page=1&limit=20&city=Vancouver&minDonation=10000
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "donors": [
 *     {
 *       "id": "1",
 *       "pmm": "Parvati Patel",
 *       "first_name": "Mei",
 *       "last_name": "Lee",
 *       "total_donations": 89267,
 *       "tags": ["High Priority", "Cancer Research Interest"]
 *     },
 *     ...
 *   ],
 *   "total": 85,
 *   "page": 1,
 *   "limit": 20,
 *   "pages": 5
 * }
 */
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      sort = 'last_name',
      order = 'asc',
      pmm,
      city,
      excluded,
      deceased,
      tags,
      minDonation,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where conditions based on filters
    const where = {};

    if (pmm) where.pmm = pmm;
    if (city) where.city = city;
    if (excluded === 'true') where.excluded = true;
    if (excluded === 'false') where.excluded = false;
    if (deceased === 'true') where.deceased = true;
    if (deceased === 'false') where.deceased = false;
    
    if (minDonation) {
      where.total_donations = {
        gte: parseFloat(minDonation)
      };
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { organization_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Handle tag filtering
    if (tags) {
      const tagList = tags.split(',');
      where.tags = {
        hasSome: tagList
      };
    }

    // Get total count for pagination
    const total = await prisma.donor.count({ where });

    // Get donors with pagination, sorting, and filtering
    const donors = await prisma.donor.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sort]: order.toLowerCase()
      },
      include: {
        tags: true
      }
    });

    // Format the donors array to include tags as an array of strings
    const formattedDonors = donors.map(donor => ({
      ...donor,
      tags: donor.tags.map(tag => tag.name)
    }));

    res.json({
      donors: formatDonor(formattedDonors),
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Get donor by ID
 * 
 * @name GET /api/donors/:id
 * @function
 * @memberof module:DonorAPI
 * @inner
 * @param {string} req.params.id - Donor ID
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Donor details
 * @returns {Error} 400 - Invalid donor ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Donor not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/donors/123
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "id": "123",
 *   "constituentId": "D-10023",
 *   "pmm": "Parvati Patel",
 *   "first_name": "Mei",
 *   "last_name": "Lee",
 *   "total_donations": 89267,
 *   "tags": ["High Priority", "Cancer Research Interest"],
 *   ...
 * }
 */
router.get('/:id', protect, async (req, res) => {
  try {
    let donorId;
    try {
      donorId = BigInt(req.params.id);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid donor ID format' });
    }

    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      include: {
        tags: true
      }
    });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Format the donor to include tags as an array of strings
    const formattedDonor = {
      ...donor,
      tags: donor.tags.map(tag => tag.name)
    };

    res.json(formatDonor(formattedDonor));
  } catch (error) {
    console.error('Error fetching donor:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * Import donors from CSV or Excel file
 * 
 * @name POST /api/donors/import
 * @function
 * @memberof module:DonorAPI
 * @inner
 * @param {File} req.file - CSV or Excel file
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Import results
 * @returns {Error} 400 - Missing file or invalid format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request (multipart/form-data)
 * POST /api/donors/import
 * Authorization: Bearer <token>
 * [file data]
 * 
 * // Success Response
 * {
 *   "success": true,
 *   "imported": 127,
 *   "updated": 43,
 *   "errors": [
 *     {
 *       "row": 15,
 *       "error": "Missing required field: last_name"
 *     }
 *   ],
 *   "message": "Donor import completed with 1 error"
 * }
 */
router.post('/import', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let donorsData = [];
    let errors = [];
    
    // Parse file based on its extension
    if (fileExtension === '.csv') {
      // Parse CSV file
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
      });
      
      donorsData = parseResult.data;
      
      // Check for parsing errors
      if (parseResult.errors && parseResult.errors.length > 0) {
        parseResult.errors.forEach(error => {
          errors.push({
            row: error.row + 1, // Add 1 to match Excel row numbers (1-indexed)
            error: error.message
          });
        });
      }
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      donorsData = xlsx.utils.sheet_to_json(worksheet);
    } else {
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Unsupported file format. Please upload CSV or Excel file.' });
    }

    // Process donors data
    let imported = 0;
    let updated = 0;

    for (let i = 0; i < donorsData.length; i++) {
      const row = i + 2; // Excel row number (header is row 1)
      const donorData = donorsData[i];
      
      try {
        // Check if donor already exists by name
        let existingDonor = null;
        if (donorData.first_name && donorData.last_name) {
          existingDonor = await prisma.donor.findFirst({
            where: {
              firstName: donorData.first_name,
              lastName: donorData.last_name
            }
          });
        }

        // Format donor data for database - mapping CSV fields to database fields
        const donor = {
          pmm: donorData.pmm || null,
          smm: donorData.smm || null,
          vmm: donorData.vmm || null,
          excluded: donorData.exclude === 'yes' || donorData.exclude === true || false,
          deceased: donorData.deceased === 'yes' || donorData.deceased === true || false,
          firstName: donorData.first_name || null,
          nickName: donorData.nick_name || null,
          lastName: donorData.last_name || null,
          organizationName: donorData.organization_name || null,
          totalDonations: parseFloat(donorData.total_donations) || 0,
          totalPledges: parseFloat(donorData.total_pledge) || 0,
          largestGift: parseFloat(donorData.largest_gift) || 0,
          largestGiftAppeal: donorData.largest_gift_appeal || null,
          firstGiftDate: donorData.first_gift_date ? new Date(parseInt(donorData.first_gift_date) * 1000) : null,
          lastGiftDate: donorData.last_gift_date ? new Date(parseInt(donorData.last_gift_date) * 1000) : null,
          lastGiftAmount: parseFloat(donorData.last_gift_amount) || 0,
          lastGiftRequest: donorData.lastGiftRequest ? String(donorData.lastGiftRequest) : null,
          lastGiftAppeal: donorData.last_gift_appeal || null,
          addressLine1: donorData.address_line1 || null,
          addressLine2: donorData.address_line2 || null,
          city: donorData.city || null,
          contactPhoneType: donorData.contact_phone_type || null,
          phoneRestrictions: donorData.phone_restrictions || null,
          emailRestrictions: donorData.email_restrictions || null,
          communicationRestrictions: donorData.communication_restrictions || null,
          subscriptionEventsInPerson: donorData.subscription_events_in_person || null,
          subscriptionEventsMagazine: donorData.subscription_events_magazine || null,
          communicationPreference: donorData.communication_preference || null
        };

        if (existingDonor) {
          // Update existing donor
          await prisma.donor.update({
            where: { id: existingDonor.id },
            data: donor
          });
          
          updated++;
        } else {
          // Create new donor
          await prisma.donor.create({
            data: donor
          });
          
          imported++;
        }
      } catch (error) {
        console.error(`Error processing donor at row ${row}:`, error);
        errors.push({
          row,
          error: `Error processing donor: ${error.message}`
        });
      }
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      imported,
      updated,
      errors,
      message: `Donor import completed with ${errors.length} error${errors.length !== 1 ? 's' : ''}`
    });
  } catch (error) {
    console.error('Error importing donors:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

export default router;
