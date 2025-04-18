# Event Management System

A comprehensive event management system for handling donor events, donor management, and event-donor relationships.

## Features

- Event Management
  - Create and manage events
  - Track event status (Planning, List Generation, Review, Ready, Complete)
  - Set event details (date, location, capacity, etc.)
  - Export donor lists

- Donor Management
  - Add and manage donors
  - Track donor information and history
  - Manage donor status for events
  - Export donor data

- User Interface
  - Modern and responsive design
  - Intuitive navigation
  - Real-time status updates
  - Search and filter capabilities

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone git@github.com:J3rrrrry/CS5500-Project.git
cd CS5500-Project

2. Install dependencies:
```bash
# Install backend dependencies
cd Server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both Server and client directories
   - Update the variables with your configuration

4. Start the development servers:
```bash
# Start backend server (from Server directory)
npm run dev

# Start frontend server (from client directory)
npm start
```

## Project Structure

```
.
├── Server/                 # Backend server
│   ├── src/               # Source code
│   ├── tests/             # Test files
│   └── package.json       # Backend dependencies
├── client/                # Frontend application
│   ├── src/              # Source code
│   ├── public/           # Static files
│   └── package.json      # Frontend dependencies
└── scripts/              # Utility scripts
    └── uploadTestData.js # Test data upload script
```

## Testing

### Backend Tests
```bash
cd Server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact [support-email] or create an issue in the repository.

## Docker 部署

### 拉取镜像

```bash
# 登录到GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $(echo $GITHUB_USERNAME | tr '[:upper:]' '[:lower:]') --password-stdin

# 拉取镜像
docker pull ghcr.io/$(echo $GITHUB_USERNAME | tr '[:upper:]' '[:lower:]')/cs5500-project:latest
```

### 运行容器

```bash
docker run -d \
  -p 3000:3000 \
  -p 5000:5000 \
  --name cs5500-app \
  ghcr.io/$(echo $GITHUB_USERNAME | tr '[:upper:]' '[:lower:]')/cs5500-project:latest
```

### 使用 docker-compose

1. 创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/$(echo $GITHUB_USERNAME | tr '[:upper:]' '[:lower:]')/cs5500-project:latest
    container_name: cs5500-app
    restart: always
    ports:
      - "3000:3000"
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - API_PORT=5000
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

2. 启动服务：

```bash
docker-compose up -d
```

### 环境变量

可以通过环境变量配置应用：

- `PORT`: 前端服务端口（默认：3000）
- `API_PORT`: 后端服务端口（默认：5000）
- `NODE_ENV`: 运行环境（默认：production）