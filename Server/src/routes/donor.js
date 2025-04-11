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
    // 解析并验证捐赠者ID
    let donorId;
    try {
      donorId = parseInt(req.params.id);
      if (isNaN(donorId)) {
        return res.status(400).json({ message: 'Invalid donor ID format' });
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid donor ID format' });
    }

    // 验证捐赠者是否存在
    const donorExists = await prisma.donor.findUnique({
      where: { id: donorId }
    });

    if (!donorExists) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // 从请求体中获取更新数据
    const rawUpdateData = req.body;
    
    // 只保留有效的捐赠者字段
    const validFields = [
      'pmm', 'smm', 'vmm', 'excluded', 'deceased', 
      'firstName', 'nickName', 'lastName', 'organizationName', 
      'totalDonations', 'totalPledges', 'largestGift', 'largestGiftAppeal', 
      'firstGiftDate', 'lastGiftDate', 'lastGiftAmount', 'lastGiftRequest', 'lastGiftAppeal', 
      'addressLine1', 'addressLine2', 'city', 
      'contactPhoneType', 'phoneRestrictions', 'emailRestrictions', 'communicationRestrictions', 
      'subscriptionEventsInPerson', 'subscriptionEventsMagazine', 'communicationPreference'
    ];
    
    // 过滤掉不存在的字段
    const updateData = {};
    validFields.forEach(field => {
      if (rawUpdateData[field] !== undefined) {
        updateData[field] = rawUpdateData[field];
      }
    });
    
    // 记录更新操作
    console.log(`Updating donor with ID ${donorId}:`, updateData);
    
    // 处理日期字段，确保它们是有效的格式
    if (updateData.firstGiftDate) {
      updateData.firstGiftDate = new Date(updateData.firstGiftDate);
    }
    
    if (updateData.lastGiftDate) {
      updateData.lastGiftDate = new Date(updateData.lastGiftDate);
    }

    // 更新捐赠者信息
    const updatedDonor = await prisma.donor.update({
      where: { id: donorId },
      data: updateData
    });

    // 返回更新后的捐赠者信息
    res.json(formatDonor(updatedDonor));
  } catch (error) {
    console.error('Error updating donor:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to update donor', error: error.message });
  }
});
/**
 * Import donors from CSV or Excel file - 无事务版本
 * 
 * @name POST /api/donors/import
 * @function
 * @memberof module:DonorAPI
 * @inner
 */
router.post('/import', protect, upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    // 验证是否有文件上传
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let donorsData = [];
    let errors = [];
    
    // 根据文件扩展名解析文件
    if (fileExtension === '.csv') {
      // 解析CSV文件
      try {
        const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' });
        
        const contentWithoutBOM = fileContent.replace(/^\uFEFF/, '');
        
        const cleanContent = contentWithoutBOM.replace(/\r/g, '');
        
        const parseResult = Papa.parse(cleanContent, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          delimiter: ",", 
          transformHeader: (header) => header.trim().toLowerCase(),
          quoteChar: '"', 
          escapeChar: '"',
          encoding: 'utf8',
          detectEncoding: true
        });
        
        donorsData = parseResult.data;
        
        // 检查解析错误
        if (parseResult.errors && parseResult.errors.length > 0) {
          parseResult.errors.forEach(error => {
            errors.push({
              row: error.row + 1,
              error: error.message
            });
          });
        }
      } catch (csvError) {
        console.error('Error parsing CSV file:', csvError);
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: `Error parsing CSV file: ${csvError.message}` });
      }
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // 解析Excel文件
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        donorsData = xlsx.utils.sheet_to_json(worksheet, { 
          raw: false, // 获取格式化的字符串而不是类型化值
          defval: '' // 为空单元格设置默认值为空字符串而不是undefined
        });
        
        // 标准化Excel数据的字段名
        donorsData = donorsData.map(row => {
          const normalizedRow = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim().toLowerCase()] = row[key];
          });
          return normalizedRow;
        });
      } catch (excelError) {
        console.error('Error parsing Excel file:', excelError);
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: `Error parsing Excel file: ${excelError.message}` });
      }
    } else {
      // 不支持的文件格式
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: 'Unsupported file format. Please upload CSV or Excel file.' 
      });
    }

    // 记录导入的数据行以进行调试
    console.log(`Processing ${donorsData.length} donor records from imported file`);
    if (donorsData.length > 0) {
      console.log('Sample data row:', JSON.stringify(donorsData[0], null, 2));
      console.log('Available fields:', Object.keys(donorsData[0]));
    }
    
    // 初始化导入统计数据
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    // 定义辅助函数
    const getFieldValue = (donorData, fieldNames, defaultValue = null) => {
      for (const name of fieldNames) {
        if (donorData[name] !== undefined && donorData[name] !== '') {
          return donorData[name];
        }
      }
      return defaultValue;
    };

    const parseDate = (value) => {
      if (!value) return null;
      
      // 如果是数字（可能是时间戳），尝试转换
      if (typeof value === 'number' || !isNaN(value)) {
        // 尝试作为Unix时间戳（秒）处理
        const timestamp = parseInt(value);
        if (timestamp > 1000000000) { // 确保是合理的时间戳（2001年以后）
          return new Date(timestamp * 1000);
        }
      }
      
      // 尝试作为标准日期字符串处理
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return null;
    };

    const parseNumber = (value, defaultValue = 0) => {
      if (value === undefined || value === null || value === '') return defaultValue;
      
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    };

    const parseBoolean = (value) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        const lowercaseValue = value.toLowerCase();
        return lowercaseValue === 'yes' || 
              lowercaseValue === 'true' || 
              lowercaseValue === '1' || 
              lowercaseValue === 'y';
      }
      if (typeof value === 'number') return value === 1;
      return false;
    };

    // 获取所有已存在的捐赠者，用于快速查找
    console.log('Building donor lookup map...');
    const existingDonors = await prisma.donor.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        organizationName: true
      }
    });
    
    // 构建查找映射
    const donorIdMap = new Map();
    for (const donor of existingDonors) {
      // 个人捐赠者
      if (donor.firstName && donor.lastName) {
        donorIdMap.set(`${donor.firstName.toLowerCase()}|${donor.lastName.toLowerCase()}`, donor.id);
      }
      
      // 组织捐赠者
      if (donor.organizationName) {
        donorIdMap.set(`org|${donor.organizationName.toLowerCase()}`, donor.id);
      }
    }
    console.log(`Built lookup map with ${donorIdMap.size} entries`);

    // 逐个处理每条记录
    for (let i = 0; i < donorsData.length; i++) {
      const row = i + 2; // Excel行号（标题行为1）
      const donorData = donorsData[i];
      
      try {
        // 验证基本必需字段
        const firstName = getFieldValue(donorData, ['first_name', 'firstname'], '');
        const lastName = getFieldValue(donorData, ['last_name', 'lastname'], '');
        const orgName = getFieldValue(donorData, ['organization_name', 'organizationname'], '');
        
        if (!firstName && !lastName && !orgName) {
          console.log(`Row ${row}: Skipping - missing required identification fields`);
          errors.push({
            row,
            error: 'Missing required identification fields (first name, last name, or organization name)'
          });
          skipped++;
          continue;
        }
        
        // 检查捐赠者是否已存在
        let existingDonorId = null;
        
        if (firstName && lastName) {
          existingDonorId = donorIdMap.get(`${firstName.toLowerCase()}|${lastName.toLowerCase()}`);
        } else if (orgName) {
          existingDonorId = donorIdMap.get(`org|${orgName.toLowerCase()}`);
        }

        // 准备捐赠者数据对象
        const donor = {
          // 基本信息字段
          pmm: getFieldValue(donorData, ['pmm'], ''),
          smm: getFieldValue(donorData, ['smm'], ''),
          vmm: getFieldValue(donorData, ['vmm'], ''),
          excluded: parseBoolean(getFieldValue(donorData, ['exclude', 'excluded'])),
          deceased: parseBoolean(getFieldValue(donorData, ['deceased'])),
          
          // 个人/组织信息
          firstName: String(getFieldValue(donorData, ['first_name', 'firstname'], '')).normalize('NFKC'),
          lastName: String(getFieldValue(donorData, ['last_name', 'lastname'], '')).normalize('NFKC'),
          organizationName: String(getFieldValue(donorData, ['organization_name', 'organizationname'], '')).normalize('NFKC'),
          nickName: String(getFieldValue(donorData, ['nick_name', 'nickname'], '')).normalize('NFKC'),
          
          // 捐赠信息
          totalDonations: parseNumber(getFieldValue(donorData, [
            'total_donations', 'totaldonations', 'totalDonations'
          ])),
          
          totalPledges: parseNumber(getFieldValue(donorData, [
            'total_pledge', 'totalpledge', 'totalPledges'
          ])),
          
          largestGift: parseNumber(getFieldValue(donorData, [
            'largest_gift', 'largestgift', 'largestGift'
          ])),
          
          largestGiftAppeal: getFieldValue(donorData, [
            'largest_gift_appeal', 'largestgiftappeal', 'largestGiftAppeal'
          ], ''),
          
          firstGiftDate: parseDate(getFieldValue(donorData, [
            'first_gift_date', 'firstgiftdate', 'firstGiftDate'
          ])),
          
          lastGiftDate: parseDate(getFieldValue(donorData, [
            'last_gift_date', 'lastgiftdate', 'lastGiftDate'
          ])),
          
          lastGiftAmount: parseNumber(getFieldValue(donorData, [
            'last_gift_amount', 'lastgiftamount', 'lastGiftAmount'
          ])),
          
          lastGiftRequest: String(getFieldValue(donorData, [
            'last_gift_request', 'lastgiftrequest', 'lastGiftRequest'
          ], '')),
          
          lastGiftAppeal: getFieldValue(donorData, [
            'last_gift_appeal', 'lastgiftappeal', 'lastGiftAppeal'
          ], ''),
          
          // 地址信息
          addressLine1: String(getFieldValue(donorData, ['address_line1', 'address1'], '')).normalize('NFKC'),
          addressLine2: String(getFieldValue(donorData, ['address_line2', 'address2'], '')).normalize('NFKC'),
          city: String(getFieldValue(donorData, ['city'], '')).normalize('NFKC'),
          
          // 通信偏好和限制
          contactPhoneType: getFieldValue(donorData, [
            'contact_phone_type', 'contactphonetype', 'contactPhoneType'
          ], ''),
          
          phoneRestrictions: getFieldValue(donorData, [
            'phone_restrictions', 'phonerestrictions', 'phoneRestrictions'
          ], ''),
          
          emailRestrictions: getFieldValue(donorData, [
            'email_restrictions', 'emailrestrictions', 'emailRestrictions'
          ], ''),
          
          communicationRestrictions: getFieldValue(donorData, [
            'communication_restrictions', 'communicationrestrictions', 'communicationRestrictions'
          ], ''),
          
          subscriptionEventsInPerson: getFieldValue(donorData, [
            'subscription_events_in_person', 'subscriptioneventsinperson', 'subscriptionEventsInPerson'
          ], ''),
          
          subscriptionEventsMagazine: getFieldValue(donorData, [
            'subscription_events_magazine', 'subscriptioneventsmagazine', 'subscriptionEventsMagazine'
          ], ''),
          
          communicationPreference: getFieldValue(donorData, [
            'communication_preference', 'communicationpreference', 'communicationPreference'
          ], '')
        };

        // 移除undefined值但保留null和空字符串
        Object.keys(donor).forEach(key => {
          if (donor[key] === undefined) {
            delete donor[key];
          }
        });

        // 根据是否存在决定创建或更新
        if (existingDonorId) {
          console.log(`Row ${row}: Updating donor ID ${existingDonorId}`);
          
          try {
            // 先检查记录是否存在
            const checkDonor = await prisma.donor.findUnique({
              where: { id: existingDonorId },
              select: { id: true }
            });
            
            if (!checkDonor) {
              console.log(`Donor ID ${existingDonorId} not found, creating instead...`);
              const createdDonor = await prisma.donor.create({
                data: donor
              });
              
              console.log(`Created new donor with ID ${createdDonor.id}`);
              imported++;
              
              // 更新映射
              if (firstName && lastName) {
                donorIdMap.set(`${firstName.toLowerCase()}|${lastName.toLowerCase()}`, createdDonor.id);
              } else if (orgName) {
                donorIdMap.set(`org|${orgName.toLowerCase()}`, createdDonor.id);
              }
            } else {
              // 执行更新
              await prisma.donor.update({
                where: { id: existingDonorId },
                data: donor
              });
              
              console.log(`Updated donor ID ${existingDonorId}`);
              updated++;
            }
          } catch (updateError) {
            console.error(`Error updating donor at row ${row}:`, updateError);
            errors.push({
              row,
              error: `Error updating donor: ${updateError.message}`
            });
          }
        } else {
          console.log(`Row ${row}: Creating new donor`);
          
          try {
            const createdDonor = await prisma.donor.create({
              data: donor
            });
            
            console.log(`Created new donor with ID ${createdDonor.id}`);
            imported++;
            
            // 更新映射
            if (firstName && lastName) {
              donorIdMap.set(`${firstName.toLowerCase()}|${lastName.toLowerCase()}`, createdDonor.id);
            } else if (orgName) {
              donorIdMap.set(`org|${orgName.toLowerCase()}`, createdDonor.id);
            }
          } catch (createError) {
            console.error(`Error creating donor at row ${row}:`, createError);
            errors.push({
              row,
              error: `Error creating donor: ${createError.message}`
            });
          }
        }
      } catch (error) {
        console.error(`Error processing donor at row ${row}:`, error);
        errors.push({
          row,
          error: `Error processing donor: ${error.message}`
        });
      }
    }
    
    // 处理完成后，验证结果
    console.log('Import completed. Imported:', imported, 'Updated:', updated, 'Skipped:', skipped, 'Errors:', errors.length);
    
    // 最近导入的记录验证
    try {
      console.log('Verifying recent imports...');
      const recentDonors = await prisma.donor.findMany({
        take: 5,
        orderBy: { id: 'desc' }
      });
      console.log('Most recent donors in database:', JSON.stringify(recentDonors, null, 2));
    } catch (verifyError) {
      console.error('Error verifying recent imports:', verifyError);
    }

    // 返回导入结果
    return res.json({
      success: true,
      imported,
      updated,
      skipped,
      errors,
      message: `Donor import completed with ${errors.length} error${errors.length !== 1 ? 's' : ''}`
    });
  } catch (error) {
    console.error('Error importing donors:', error);
    
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  } finally {
    // 清理上传的文件（如果存在）
    if (filePath) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temporary file: ${filePath}`);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
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

    // 验证所有ID都是有效的数字
    const validIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (validIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Some donor IDs are invalid'
      });
    }

    // 使用事务来确保数据一致性
    await prisma.$transaction([
      // 先删除相关的eventDonor记录
      prisma.eventDonor.deleteMany({
        where: {
          donorId: {
            in: validIds
          }
        }
      }),
      // 然后删除捐赠者
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
