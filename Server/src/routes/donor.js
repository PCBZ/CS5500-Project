import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import  progressService  from '../routes/progressService.js';
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
export const formatDonor = (donor) => {
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
    
    // Get minDonation parameter from query
    const minDonation = req.query.minDonation;
    
    if (minDonation) {
      where.totalDonations = {
        gte: parseFloat(minDonation)
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
 * Update donor information
 * 
 * @name PUT /api/donors/:id
 * @function
 * @memberof module:DonorAPI
 * @inner
 * @param {string} req.params.id - Donor ID
 * @param {Object} req.body - Updated donor data
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Updated donor details
 * @returns {Error} 400 - Invalid donor ID format
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 404 - Donor not found
 * @returns {Error} 500 - Server error
 * 
 * @example
 * // Request
 * PUT /api/donors/123
 * Authorization: Bearer <token>
 * {
 *   "firstName": "Mei",
 *   "lastName": "Lee-Wong",
 *   "pmm": "John Smith",
 *   ...
 * }
 * 
 * // Success Response
 * {
 *   "id": "123",
 *   "firstName": "Mei",
 *   "lastName": "Lee-Wong",
 *   "pmm": "John Smith",
 *   ...
 * }
 */
router.put('/:id', protect, async (req, res) => {
  try {
    // Parse and validate donor ID
    let donorId;
    try {
      donorId = parseInt(req.params.id);
      if (isNaN(donorId)) {
        return res.status(400).json({ message: 'Invalid donor ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid donor ID format' });
    }

    // Verify if donor exists
    const donorExists = await prisma.donor.findUnique({
      where: { id: donorId }
    });

    if (!donorExists) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Get update data from request body
    const rawUpdateData = req.body;
    
    // Keep only valid donor fields
    const validFields = [
      'pmm', 'smm', 'vmm', 'excluded', 'deceased', 
      'firstName', 'nickName', 'lastName', 'organizationName', 
      'totalDonations', 'totalPledges', 'largestGift', 'largestGiftAppeal', 
      'firstGiftDate', 'lastGiftDate', 'lastGiftAmount', 'lastGiftRequest', 'lastGiftAppeal', 
      'addressLine1', 'addressLine2', 'city', 
      'contactPhoneType', 'phoneRestrictions', 'emailRestrictions', 'communicationRestrictions', 
      'subscriptionEventsInPerson', 'subscriptionEventsMagazine', 'communicationPreference'
    ];
    
    // Filter out non-existent fields
    const updateData = {};
    validFields.forEach(field => {
      if (rawUpdateData[field] !== undefined) {
        updateData[field] = rawUpdateData[field];
      }
    });
    
    // Log update operation
    console.log(`Updating donor with ID ${donorId}:`, updateData);
    
    // Process date fields to ensure they are in valid format
    if (updateData.firstGiftDate) {
      updateData.firstGiftDate = new Date(updateData.firstGiftDate);
    }
    
    if (updateData.lastGiftDate) {
      updateData.lastGiftDate = new Date(updateData.lastGiftDate);
    }

    // Update donor information
    const updatedDonor = await prisma.donor.update({
      where: { id: donorId },
      data: updateData
    });

    // Return updated donor information
    res.json(formatDonor(updatedDonor));
  } catch (error) {
    console.error('Error updating donor:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to update donor', error: error.message });
  }
});
// 更新的 donor.js 中的导入函数 - 添加了进度跟踪支持

/**
 * Import donors from CSV or Excel file with progress tracking
 * 
 * @name POST /api/donors/import
 * @function
 * @memberof module:DonorAPI
 * @inner
 */
router.post('/import', protect, upload.single('file'), async (req, res) => {
  let filePath = null;
  let trackingId = null;
  
  const cleanupFile = async () => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
        console.log(`Cleaned up temporary file: ${filePath}`);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
  };
  
  try {
    // Create progress tracker
    const { operation, trackingId: opTrackingId } = progressService.createOperation(
      'donor_import',
      req.user?.id || 'anonymous',
      100
    );
    
    trackingId = opTrackingId;
    
    // Send initial response
    res.status(202).json({
      success: true,
      operationId: trackingId,
      message: 'Import processing started',
    });
    
    // Validate file upload
    if (!req.file) {
      await progressService.updateProgress(trackingId, 0, 'No file imported', 'error');
      return;
    }
    
    await progressService.updateProgress(trackingId, 5, 'File uploaded successfully', 'processing');
    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let donorsData = [];
    let errors = [];
    
    // Parse file based on extension
    if (fileExtension === '.csv') {
      try {
        await progressService.updateProgress(trackingId, 10, 'Parsing CSV file...', 'processing');
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        console.log('Raw file content:', fileContent.substring(0, 200)); // Log first 200 chars
        
        const parseResult = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          encoding: 'utf8',
          transformHeader: (header) => {
            console.log('Original header:', header);
            return header.toLowerCase().trim();
          }
        });
        
        if (parseResult.errors && parseResult.errors.length > 0) {
          console.log('CSV parsing errors:', parseResult.errors);
          parseResult.errors.forEach(error => {
            errors.push({
              row: error.row + 1,
              error: error.message
            });
          });
        }

        donorsData = parseResult.data;
        console.log('Parsed data length:', donorsData.length);
        
        if (donorsData.length > 0) {
          console.log('First row headers:', Object.keys(donorsData[0]));
          console.log('First row data:', donorsData[0]);
        } else {
          console.log('No data rows found in the CSV');
          errors.push({
            row: 1,
            error: 'No data rows found in the CSV file'
          });
        }
      } catch (csvError) {
        console.error('Error parsing CSV file:', csvError);
        await progressService.updateProgress(trackingId, 10, `CSV Parsing error: ${csvError.message}`, 'error');
        return;
      }
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      try {
        await progressService.updateProgress(trackingId, 10, 'Parsing Excel File...', 'processing');
        
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get the range of the worksheet
        const range = xlsx.utils.decode_range(worksheet['!ref']);
        console.log('Excel sheet range:', range);
        
        donorsData = xlsx.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: '',
          header: 1
        });
        
        // Get headers from first row
        const headers = donorsData[0].map(header => header.toLowerCase().trim());
        console.log('Excel headers:', headers);
        
        // Convert the data to objects with proper headers
        donorsData = donorsData.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        console.log('Parsed Excel data length:', donorsData.length);
        if (donorsData.length > 0) {
          console.log('First row data:', donorsData[0]);
        }
      } catch (excelError) {
        console.error('Error parsing Excel file:', excelError);
        await progressService.updateProgress(trackingId, 10, `Excel parsing error: ${excelError.message}`, 'error');
        return;
      }
    } else {
      await progressService.updateProgress(trackingId, 10, 'Unsupported file format', 'error');
      return;
    }

    // Get total count for progress calculation
    const totalItems = donorsData.length;
    const progressPerRecord = 70 / totalItems;
    
    await progressService.updateProgress(trackingId, 20, `Found ${totalItems} records to process`, 'processing');

    // Process records
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    // Get existing donors for lookup
    const existingDonors = await prisma.donor.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        organizationName: true
      }
    });
    
    const donorIdMap = new Map();
    for (const donor of existingDonors) {
      if (donor.firstName && donor.lastName) {
        donorIdMap.set(`${donor.firstName}|${donor.lastName}`, donor.id);
      }
      if (donor.organizationName) {
        donorIdMap.set(`org|${donor.organizationName}`, donor.id);
      }
    }

    for (let i = 0; i < donorsData.length; i++) {
      // Check if operation was cancelled
      const operation = progressService.getProgress(trackingId);
      if (operation?.status === 'cancelled') {
        await progressService.updateProgress(
          trackingId,
          Math.round((i / donorsData.length) * 100),
          'Operation cancelled by user',
          'cancelled'
        );
        return;
      }

      const currentProgress = Math.min(95, 25 + (i * progressPerRecord));
      if (i % 10 === 0) {
        await progressService.updateProgress(
          trackingId,
          currentProgress,
          `Processing record ${i + 1} of ${totalItems}`,
          'processing'
        );
      }

      try {
        const firstName = donorsData[i].first_name || donorsData[i].firstname || '';
        const lastName = donorsData[i].last_name || donorsData[i].lastname || '';
        const orgName = donorsData[i].organization_name || donorsData[i].organizationname || '';
        
        if (!firstName && !lastName && !orgName) {
          errors.push({
            row: i + 2,
            error: 'Missing required identification fields'
          });
          skipped++;
          continue;
        }

        // Convert Unix timestamp to ISO date string
        const convertToISODate = (timestamp) => {
          if (!timestamp || timestamp === '0') return null;
          try {
            // Check if it's a Unix timestamp (number)
            const num = parseInt(timestamp);
            if (!isNaN(num)) {
              const date = new Date(num * 1000); // Convert seconds to milliseconds
              if (!isNaN(date.getTime())) {
                return date.toISOString();
              }
            }
            return null;
          } catch (error) {
            return null;
          }
        };

        const donor = {
          pmm: donorsData[i].pmm || null,
          smm: donorsData[i].smm || null,
          vmm: donorsData[i].vmm || null,
          excluded: donorsData[i].exclude === 'yes' || donorsData[i].excluded === 'true' || false,
          deceased: donorsData[i].deceased === 'yes' || donorsData[i].deceased === 'true' || false,
          firstName: firstName || null,
          lastName: lastName || null,
          organizationName: orgName || null,
          nickName: donorsData[i].nick_name || donorsData[i].nickname || null,
          totalDonations: parseFloat(donorsData[i].total_donations || donorsData[i].totaldonations || 0) || 0,
          totalPledges: parseFloat(donorsData[i].total_pledges || donorsData[i].totalpledges || 0) || 0,
          largestGift: parseFloat(donorsData[i].largest_gift || donorsData[i].largestgift || 0) || 0,
          largestGiftAppeal: donorsData[i].largest_gift_appeal || donorsData[i].largestgiftappeal || null,
          firstGiftDate: convertToISODate(donorsData[i].first_gift_date),
          lastGiftDate: convertToISODate(donorsData[i].last_gift_date),
          lastGiftAmount: parseFloat(donorsData[i].last_gift_amount || donorsData[i].lastgiftamount || 0) || 0,
          lastGiftRequest: donorsData[i].last_gift_request || donorsData[i].lastgiftrequest || null,
          lastGiftAppeal: donorsData[i].last_gift_appeal || donorsData[i].lastgiftappeal || null,
          addressLine1: donorsData[i].address_line1 || donorsData[i].address1 || null,
          addressLine2: donorsData[i].address_line2 || donorsData[i].address2 || null,
          city: donorsData[i].city || null,
          contactPhoneType: donorsData[i].contact_phone_type || donorsData[i].contactphonetype || null,
          phoneRestrictions: donorsData[i].phone_restrictions || donorsData[i].phonerestrictions || null,
          emailRestrictions: donorsData[i].email_restrictions || donorsData[i].emailrestrictions || null,
          communicationRestrictions: donorsData[i].communication_restrictions || donorsData[i].communicationrestrictions || null,
          subscriptionEventsInPerson: donorsData[i].subscription_events_in_person || donorsData[i].subscriptioneventsinperson || null,
          subscriptionEventsMagazine: donorsData[i].subscription_events_magazine || donorsData[i].subscriptioneventsmagazine || null,
          communicationPreference: donorsData[i].communication_preference || donorsData[i].communicationpreference || null
        };

        // Clean up any null values to undefined to prevent Prisma validation errors
        Object.keys(donor).forEach(key => {
          if (donor[key] === null) {
            donor[key] = undefined;
          }
        });

        let existingDonorId = null;
        if (firstName && lastName) {
          existingDonorId = donorIdMap.get(`${firstName}|${lastName}`);
        } else if (orgName) {
          existingDonorId = donorIdMap.get(`org|${orgName}`);
        }

        if (existingDonorId) {
          await prisma.donor.update({
            where: { id: existingDonorId },
            data: donor
          });
          updated++;
        } else {
          const newDonor = await prisma.donor.create({
            data: donor
          });
          imported++;
          
          if (firstName && lastName) {
            donorIdMap.set(`${firstName}|${lastName}`, newDonor.id);
          } else if (orgName) {
            donorIdMap.set(`org|${orgName}`, newDonor.id);
          }
        }
      } catch (error) {
        console.error(`Error processing donor at row ${i + 2}:`, error);
        errors.push({
          row: i + 2,
          error: `Error processing donor: ${error.message}`
        });
      }
    }
    
    const finalMessage = `Import completed: ${imported} imported, ${updated} updated, ${skipped} skipped${errors.length > 0 ? `, ${errors.length} errors` : ''}`;
    await progressService.updateProgress(
      trackingId,
      100,
      finalMessage,
      errors.length > 0 ? 'completed_with_errors' : 'completed'
    );
    
  } catch (error) {
    console.error('Error during import:', error);
    if (trackingId) {
      await progressService.updateProgress(
        trackingId,
        0,
        `Import failed: ${error.message}`,
        'error'
      );
    }
  } finally {
    await cleanupFile();
  }
});

// Delete a donor
router.delete('/:id', protect, async (req, res) => {
  try {
    const donorId = parseInt(req.params.id);
    console.log(`Attempting to delete donor with ID: ${donorId}`);

    if (isNaN(donorId)) {
      console.error('Invalid donor ID format:', req.params.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid donor ID format'
      });
    }

    // First check if donor exists
    const existingDonor = await prisma.donor.findUnique({
      where: { id: donorId }
    });

    console.log('Found donor:', existingDonor);

    if (!existingDonor) {
      console.log(`Donor with ID ${donorId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Delete donor and any related records
    await prisma.$transaction([
      // Delete any related event donor records first
      prisma.eventDonor.deleteMany({
        where: { donorId: donorId }
      }),
      // Then delete the donor
      prisma.donor.delete({
        where: { id: donorId }
      })
    ]);

    console.log(`Successfully deleted donor with ID: ${donorId}`);
    res.json({
      success: true,
      message: 'Donor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete donor',
      error: error.message
    });
  }
});

/**
 * Batch delete donors
 * 
 * @name DELETE /api/donors/batch
 * @function
 * @memberof module:DonorAPI
 * @inner
 * @param {Array} req.body.ids - Array of donor IDs to delete
 * @param {string} req.headers.authorization - Bearer token for authentication
 * @returns {Object} 200 - Success message
 * @returns {Error} 400 - Invalid request
 * @returns {Error} 401 - Unauthorized access
 * @returns {Error} 500 - Server error
 */
router.delete('/batch', protect, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid donor IDs provided'
      });
    }

    // Validate that all IDs are valid numbers
    const validIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some donor IDs are invalid'
      });
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction([
      // First delete related eventDonor records
      prisma.eventDonor.deleteMany({
        where: {
          donorId: {
            in: validIds
          }
        }
      }),
      // Then delete the donors
      prisma.donor.deleteMany({
        where: {
          id: {
            in: validIds
          }
        }
      })
    ]);

    res.json({
      success: true,
      message: `Successfully deleted ${validIds.length} donor(s)`
    });
  } catch (error) {
    console.error('Error batch deleting donors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete donors',
      error: error.message
    });
  }
});

export default router;
