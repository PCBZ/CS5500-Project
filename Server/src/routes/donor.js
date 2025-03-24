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
 * @param {string} req.query.sort - Field to sort by (e.g., "lastName", "totalDonations")
 * @param {string} req.query.order - Sort order ("asc" or "desc")
 * @param {string} req.query.pmm - Filter by Prospect Move Manager
 * @param {string} req.query.city - Filter by city
 * @param {string} req.query.excluded - Filter by excluded status (true/false)
 * @param {string} req.query.deceased - Filter by deceased status (true/false)
 * @param {string} req.query.tags - Filter by tags (comma-separated)
 * @param {string} req.query.min_donation - Filter by minimum total donation amount
 * @param {string} req.query.search - Search term for name or organization
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - List of donors with pagination info
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * GET /api/donors?page=1&limit=20&city=Vancouver&min_donation=10000
 * Authorization: Bearer <token>
 * 
 * // Success Response
 * {
 *   "donors": [
 *     {
 *       "id": "1",
 *       "pmm": "Parvati Patel",
 *       "firstName": "Mei",
 *       "lastName": "Lee",
 *       "totalDonations": 89267,
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
      sort = 'lastName',
      order = 'asc',
      pmm,
      city,
      excluded,
      deceased,
      tags,
      min_donation,
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
    
    if (min_donation) {
      where.totalDonations = {
        gte: parseFloat(min_donation)
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { organizationName: { contains: search } }
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

    // 转换下划线格式的排序字段为驼峰命名
    // 映射查询参数中的蛇形命名到数据库模型的驼峰命名
    const sortMapping = {
      'first_name': 'firstName',
      'last_name': 'lastName',
      'organization_name': 'organizationName',
      'total_donations': 'totalDonations',
      'largest_gift': 'largestGift',
      'last_gift_date': 'lastGiftDate'
    };

    // 使用映射表或直接使用字段名（如果已经是驼峰命名）
    const sortField = sortMapping[sort] || sort;

    // Get donors with pagination, sorting, and filtering
    const donors = await prisma.donor.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        [sortField]: order.toLowerCase()
      },
      include: { eventDonors: true }
    });

    // Format the donors array to include tags as an array of strings
    const formattedDonors = donors.map(donor => ({
      ...donor,
      tags: donor.tags && Array.isArray(donor.tags) ? donor.tags.map(tag => tag.name) : []
    }));

    res.json({
      donors: formatDonor(formattedDonors),
      total: total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching donor (DETAILED):', error);
    console.error('Error stack:', error.stack);
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
 *   "firstName": "Mei",
 *   "lastName": "Lee",
 *   "totalDonations": 89267,
 *   "tags": ["High Priority", "Cancer Research Interest"],
 *   ...
 * }
 */
router.get('/:id', protect, async (req, res) => {
  try {
    let donorId;
    try {
      donorId = parseInt(req.params.id); 
      if (isNaN(donorId)) {
        return res.status(400).json({ message: 'Invalid donor ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid donor ID format' });
    }

    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      include: { eventDonors: true }
    });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Format the donor with parsed tags
    const parsedTags = donor.tags ? donor.tags.split(',').filter(tag => tag.trim() !== '') : [];
    
    // Convert camelCase field names to snake_case for API consistency
    const formattedDonor = {
      ...donor,
      tags: donor.tags && Array.isArray(donor.tags) ? donor.tags.map(tag => tag.name) : []
    };

    res.json(formatDonor(formattedDonor));
  }  catch (error) {
    console.error('Error fetching donor (DETAILED):', error);
    console.error('Error stack:', error.stack);
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
 *       "error": "Missing required field: lastName"
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
        if (donorData.firstName && donorData.lastName) {
          existingDonor = await prisma.donor.findFirst({
            where: {
              firstName: donorData.firstName,
              lastName: donorData.lastName
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
          firstName: donorData.firstName || null,
          nickName: donorData.nickName || null,
          lastName: donorData.lastName || null,
          organizationName: donorData.organizationName || null,
          totalDonations: parseFloat(donorData.totalDonations) || 0,
          totalPledges: parseFloat(donorData.totalPledge) || 0,
          largestGift: parseFloat(donorData.largestGift) || 0,
          largestGiftAppeal: donorData.largestGiftAppeal || null,
          firstGiftDate: donorData.firstGiftDate ? new Date(parseInt(donorData.firstGiftDate) * 1000) : null,
          lastGiftDate: donorData.lastGiftDate ? new Date(parseInt(donorData.lastGiftDate) * 1000) : null,
          lastGiftAmount: parseFloat(donorData.lastGiftAmount) || 0,
          lastGiftRequest: donorData.lastGiftRequest ? String(donorData.lastGiftRequest) : null,
          lastGiftAppeal: donorData.lastGiftAppeal || null,
          addressLine1: donorData.addressLine1 || null,
          addressLine2: donorData.addressLine2 || null,
          city: donorData.city || null,
          contactPhoneType: donorData.contactPhoneType || null,
          phoneRestrictions: donorData.phoneRestrictions || null,
          emailRestrictions: donorData.emailRestrictions || null,
          communicationRestrictions: donorData.communicationRestrictions || null,
          subscriptionEventsInPerson: donorData.subscriptionEventsInPerson || null,
          subscriptionEventsMagazine: donorData.subscriptionEventsMagazine || null,
          communicationPreference: donorData.communicationPreference || null
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
