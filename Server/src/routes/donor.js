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
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { organizationName: { contains: search, mode: 'insensitive' } }
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
      include: {
        eventDonors: true
      }
    });

    // Format the donors array to process tags if they exist
    const formattedDonors = donors.map(donor => {
      // Parse tags string to array if it exists and isn't empty
      const parsedTags = donor.tags ? donor.tags.split(',').filter(tag => tag.trim() !== '') : [];
      
      // Convert camelCase field names to snake_case for API consistency
      return {
        id: donor.id,
        pmm: donor.pmm,
        smm: donor.smm,
        vmm: donor.vmm,
        excluded: donor.excluded,
        deceased: donor.deceased,
        first_name: donor.firstName,
        nick_name: donor.nickName,
        last_name: donor.lastName,
        organization_name: donor.organizationName,
        total_donations: donor.totalDonations,
        total_pledges: donor.totalPledges,
        largest_gift: donor.largestGift,
        largest_gift_appeal: donor.largestGiftAppeal,
        first_gift_date: donor.firstGiftDate,
        last_gift_date: donor.lastGiftDate,
        last_gift_amount: donor.lastGiftAmount,
        last_gift_request: donor.lastGiftRequest,
        last_gift_appeal: donor.lastGiftAppeal,
        address_line1: donor.addressLine1,
        address_line2: donor.addressLine2,
        city: donor.city,
        contact_phone_type: donor.contactPhoneType,
        phone_restrictions: donor.phoneRestrictions,
        email_restrictions: donor.emailRestrictions,
        communication_restrictions: donor.communicationRestrictions,
        subscription_events_in_person: donor.subscriptionEventsInPerson,
        subscription_events_magazine: donor.subscriptionEventsMagazine,
        communication_preference: donor.communicationPreference,
        tags: parsedTags,
        // Include event donors if needed by client
        event_donors: donor.eventDonors
      };
    });

    res.json({
      donors: formatDonor(formattedDonors),
      total: total,
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
        eventDonors: true
      }
    });

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Format the donor with parsed tags
    const parsedTags = donor.tags ? donor.tags.split(',').filter(tag => tag.trim() !== '') : [];
    
    // Convert camelCase field names to snake_case for API consistency
    const formattedDonor = {
      id: donor.id,
      pmm: donor.pmm,
      smm: donor.smm,
      vmm: donor.vmm,
      excluded: donor.excluded,
      deceased: donor.deceased,
      first_name: donor.firstName,
      nick_name: donor.nickName,
      last_name: donor.lastName,
      organization_name: donor.organizationName,
      total_donations: donor.totalDonations,
      total_pledges: donor.totalPledges,
      largest_gift: donor.largestGift,
      largest_gift_appeal: donor.largestGiftAppeal,
      first_gift_date: donor.firstGiftDate,
      last_gift_date: donor.lastGiftDate,
      last_gift_amount: donor.lastGiftAmount,
      last_gift_request: donor.lastGiftRequest,
      last_gift_appeal: donor.lastGiftAppeal,
      address_line1: donor.addressLine1,
      address_line2: donor.addressLine2,
      city: donor.city,
      contact_phone_type: donor.contactPhoneType,
      phone_restrictions: donor.phoneRestrictions,
      email_restrictions: donor.emailRestrictions,
      communication_restrictions: donor.communicationRestrictions,
      subscription_events_in_person: donor.subscriptionEventsInPerson,
      subscription_events_magazine: donor.subscriptionEventsMagazine,
      communication_preference: donor.communicationPreference,
      tags: parsedTags,
      // Include event donors if needed by client
      event_donors: donor.eventDonors
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
