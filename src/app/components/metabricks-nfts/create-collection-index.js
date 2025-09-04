const fs = require('fs-extra');
const path = require('path');

// Function to create a comprehensive collection index
async function createCollectionIndex() {
    try {
        console.log('📋 Creating MetaBricks Collection Index...\n');
        
        // Read the upload results
        const resultsFile = path.join(__dirname, 'metabricks-individual-upload-results.json');
        
        if (!await fs.pathExists(resultsFile)) {
            console.log('❌ Upload results file not found. Please run the upload script first.');
            return;
        }
        
        const results = await fs.readJson(resultsFile);
        const successfulUploads = results.files.filter(f => f.ipfsHash);
        
        console.log(`📁 Found ${successfulUploads.length} successfully uploaded files\n`);
        
        // Create collection index
        const collectionIndex = {
            collection: {
                name: 'MetaBricks',
                description: 'Complete MetaBricks NFT collection with randomized mystery strategy',
                totalFiles: successfulUploads.length,
                strategy: 'Randomized Mystery',
                uploadDate: results.uploadDate,
                privateGroup: 'metabricks_jsons',
                brickTypes: {
                    regular: { count: 361, discount: '10%', range: '1-361' },
                    industrial: { count: 60, discount: '15%', range: '362-421' },
                    legendary: { count: 11, discount: '20%', range: '422-432' }
                }
            },
            files: successfulUploads.map(file => ({
                uploadNumber: file.uploadNumber,
                originalBrickId: file.originalBrickId,
                brickType: file.brickType,
                fileName: file.fileName,
                ipfsHash: file.ipfsHash,
                pinataUrl: file.pinataUrl,
                fileSize: file.fileSize,
                uploadTimestamp: file.timestamp
            }))
        };
        
        // Save the collection index
        const indexFile = path.join(__dirname, 'metabricks-collection-index.json');
        await fs.writeFile(indexFile, JSON.stringify(collectionIndex, null, 2));
        
        console.log('✅ Collection index created successfully!\n');
        console.log('📊 Collection Summary:');
        console.log(`   🏗️ Total MetaBricks: ${collectionIndex.collection.totalFiles}`);
        console.log(`   🔒 Private Group: ${collectionIndex.collection.privateGroup}`);
        console.log(`   🎲 Strategy: ${collectionIndex.collection.strategy}`);
        console.log(`   📅 Upload Date: ${collectionIndex.collection.uploadDate}\n`);
        
        console.log('🏗️ Brick Type Distribution:');
        console.log(`   🔴 Regular Bricks: ${collectionIndex.collection.brickTypes.regular.count} (${collectionIndex.collection.brickTypes.regular.range}) - ${collectionIndex.collection.brickTypes.regular.discount} TGE`);
        console.log(`   🟡 Industrial Bricks: ${collectionIndex.collection.brickTypes.industrial.count} (${collectionIndex.collection.brickTypes.industrial.range}) - ${collectionIndex.collection.brickTypes.industrial.discount} TGE`);
        console.log(`   🟣 Legendary Bricks: ${collectionIndex.collection.brickTypes.legendary.count} (${collectionIndex.collection.brickTypes.legendary.range}) - ${collectionIndex.collection.brickTypes.legendary.discount} TGE\n`);
        
        // Create a simple HTML viewer
        const htmlViewer = createHTMLViewer(collectionIndex);
        const htmlFile = path.join(__dirname, 'metabricks-collection-viewer.html');
        await fs.writeFile(htmlFile, htmlViewer);
        
        console.log('🌐 HTML Collection Viewer created!');
        console.log(`   📄 Index File: ${indexFile}`);
        console.log(`   🌐 HTML Viewer: ${htmlFile}\n`);
        
        // Show sample access URLs
        console.log('🔗 Sample Access URLs:');
        collectionIndex.files.slice(0, 5).forEach(file => {
            console.log(`   MetaBrick #${file.uploadNumber}: ${file.pinataUrl}`);
        });
        
        if (collectionIndex.files.length > 5) {
            console.log(`   ... and ${collectionIndex.files.length - 5} more files`);
        }
        
        console.log('\n💡 How to Use:');
        console.log('1. 📄 Use the JSON index file for programmatic access');
        console.log('2. 🌐 Open the HTML viewer in your browser to browse all MetaBricks');
        console.log('3. 🔗 Use individual IPFS URLs for NFT minting');
        console.log('4. 🔒 All files are organized in your private Pinata group');
        
    } catch (error) {
        console.error('❌ Error creating collection index:', error);
    }
}

// Function to create an HTML viewer for the collection
function createHTMLViewer(collectionIndex) {
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MetaBricks Collection Viewer</title>
    <style>
        @font-face {
            font-family: 'Mek Sans Regular';
            src: url('/assets/fonts/MEKSans-Regular.woff2') format('woff2');
            font-display: swap;
        }
        
        @font-face {
            font-family: 'Mek Mono';
            src: url('/assets/fonts/MEK-Mono.woff2') format('woff2');
            font-display: swap;
        }
        
        * {
            padding: 0;
            margin: 0;
            box-sizing: border-box;
            font-family: 'Mek Sans Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }
        
        body {
            background: #ffffff;
            margin: 0;
            min-height: 100vh;
            font-family: 'Mek Sans Regular', sans-serif !important;
            color: #333 !important;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 35px;
        }
        
        .header {
            background: linear-gradient(135deg, #343BE6 0%, #4A52F0 100%);
            padding: 40px 0;
            text-align: center;
            border-radius: 0 0 20px 20px;
            margin-bottom: 40px;
            box-shadow: 0 8px 32px rgba(52, 59, 230, 0.2);
        }
        
        .header h1 {
            margin: 0;
            font-size: 48px;
            font-family: 'Mek Mono', 'Courier New', monospace !important;
            font-weight: 400;
            color: #fff !important;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            margin: 15px 0 0 0;
            font-size: 24px;
            font-family: 'Mek Mono', 'Courier New', monospace !important;
            color: #B0FFEC !important;
            font-weight: 400;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            padding: 0;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: #fff;
            padding: 30px;
            border: 2px solid #E8F0FE;
            border-radius: 15px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(52, 59, 230, 0.1);
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #343BE6, #679BFF, #B0FFEC);
        }
        
        .stat-card:hover {
            border-color: #343BE6;
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(52, 59, 230, 0.2);
        }
        
        .stat-card .icon {
            font-family: 'Webdings';
            font-size: 2.5em;
            color: #343BE6;
            margin-bottom: 15px;
            display: block;
        }
        
        .stat-number {
            font-size: 3.5em;
            font-family: 'Mek Mono', 'Courier New', monospace !important;
            font-weight: 400;
            color: #343BE6 !important;
            margin-bottom: 10px;
        }
        
        .stat-label {
            color: #679BFF !important;
            font-size: 18px;
            font-weight: 400;
            font-family: 'Mek Sans Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }
        
        .controls {
            padding: 30px;
            background: #fff;
            border: 2px solid #E8F0FE;
            border-radius: 15px;
            margin-bottom: 40px;
            box-shadow: 0 4px 20px rgba(52, 59, 230, 0.1);
        }
        
        .search-box {
            width: 100%;
            padding: 18px;
            border: 2px solid #E8F0FE;
            border-radius: 10px;
            font-size: 18px;
            margin-bottom: 25px;
            background: #fff;
            color: #333 !important;
            font-family: 'Mek Sans Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
            transition: all 0.3s ease;
        }
        
        .search-box::placeholder {
            color: #999 !important;
        }
        
        .search-box:focus {
            outline: none;
            border-color: #343BE6;
            box-shadow: 0 0 0 3px rgba(52, 59, 230, 0.1);
        }
        
        .filter-buttons {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .filter-btn {
            padding: 14px 28px;
            border: 2px solid #E8F0FE;
            border-radius: 25px;
            background: #fff;
            color: #679BFF !important;
            cursor: pointer;
            font-size: 16px;
            font-family: 'Mek Mono', 'Courier New', monospace !important;
            font-weight: 400;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .filter-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(52, 59, 230, 0.1), transparent);
            transition: left 0.5s;
        }
        
        .filter-btn:hover::before {
            left: 100%;
        }
        
        .filter-btn:hover {
            border-color: #343BE6;
            color: #343BE6 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(52, 59, 230, 0.2);
        }
        
        .filter-btn.active {
            background: #343BE6;
            border-color: #343BE6;
            color: #fff !important;
            box-shadow: 0 4px 15px rgba(52, 59, 230, 0.3);
        }
        
        .bricks-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
            gap: 25px;
            padding: 0;
            max-height: 700px;
            overflow-y: auto;
        }
        
        .brick-card {
            background: #fff;
            border: 2px solid #E8F0FE;
            border-radius: 15px;
            padding: 30px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(52, 59, 230, 0.1);
        }
        
        .brick-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            transition: all 0.3s ease;
        }
        
        .brick-card.regular::before { background: #B0FFEC; }
        .brick-card.industrial::before { background: #679BFF; }
        .brick-card.legendary::before { background: #343BE6; }
        
        .brick-card:hover {
            border-color: #343BE6;
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(52, 59, 230, 0.2);
        }
        
        .brick-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #E8F0FE;
        }
        
        .brick-number {
            font-size: 2.2em;
            font-family: 'Mek Mono', 'Courier New', monospace !important;
            font-weight: 400;
            color: #343BE6 !important;
        }
        
        .brick-type {
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 0.9em;
            font-family: 'Mek Mono', 'Courier New', monospace !important;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
        }
        
        .brick-type.regular { 
            background: rgba(176, 255, 236, 0.1); 
            color: #00A67E !important;
            border: 2px solid #B0FFEC;
        }
        
        .brick-type.industrial { 
            background: rgba(103, 155, 255, 0.1); 
            color: #4A90E2 !important;
            border: 2px solid #679BFF;
        }
        
        .brick-type.legendary { 
            background: rgba(52, 59, 230, 0.1); 
            color: #343BE6 !important;
            border: 2px solid #343BE6;
        }
        
        .brick-details {
            margin-bottom: 25px;
        }
        
        .brick-detail {
            margin: 10px 0;
            font-size: 16px;
            color: #666 !important;
            font-family: 'Mek Sans Regular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }
        
        .brick-actions {
            display: flex;
            gap: 15px;
        }
        
        .action-btn {
            padding: 14px 24px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-family: 'Mek Mono', 'Courier New', monospace !important;
            font-weight: 400;
            transition: all 0.3s ease;
            flex: 1;
            position: relative;
            overflow: hidden;
        }
        
        .action-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .action-btn:hover::before {
            left: 100%;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .view-btn {
            background: #00A67E;
            color: #fff !important;
        }
        
        .view-btn:hover {
            background: #008F6B;
        }
        
        .copy-btn {
            background: #FF6B35;
            color: #fff !important;
        }
        
        .copy-btn:hover {
            background: #E55A2B;
        }
        
        .footer {
            padding: 40px;
            background: linear-gradient(135deg, #343BE6 0%, #4A52F0 100%);
            text-align: center;
            color: #fff !important;
            border-radius: 20px 20px 0 0;
            margin-top: 40px;
            font-family: 'Mek Mono', 'Courier New', monospace !important;
            box-shadow: 0 -8px 32px rgba(52, 59, 230, 0.2);
        }
        
        .footer p {
            margin: 8px 0;
            font-size: 18px;
            color: #B0FFEC !important;
        }
        
        /* Scrollbar styling */
        .bricks-grid::-webkit-scrollbar {
            width: 8px;
        }
        
        .bricks-grid::-webkit-scrollbar-track {
            background: #343BE6;
            border: 1px solid #679BFF;
        }
        
        .bricks-grid::-webkit-scrollbar-thumb {
            background: #679BFF;
            border-radius: 4px;
        }
        
        .bricks-grid::-webkit-scrollbar-thumb:hover {
            background: #B0FFEC;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .container {
                padding: 0 20px;
            }
            
            .header h1 {
                font-size: 36px;
            }
            
            .header p {
                font-size: 20px;
            }
            
            .stats {
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                padding: 20px;
            }
            
            .stat-number {
                font-size: 2.5em;
            }
            
            .bricks-grid {
                grid-template-columns: 1fr;
                gap: 15px;
                padding: 20px 0;
            }
            
            .filter-buttons {
                gap: 10px;
            }
            
            .filter-btn {
                padding: 10px 20px;
                font-size: 14px;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 0 15px;
            }
            
            .header h1 {
                font-size: 28px;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
            
            .controls {
                padding: 20px;
            }
            
            .search-box {
                padding: 12px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏗️ MetaBricks Collection</h1>
            <p>Complete NFT collection with randomized mystery strategy</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <span class="icon">🏗️</span>
                <div class="stat-number">${collectionIndex.collection.totalFiles}</div>
                <div class="stat-label">Total MetaBricks</div>
            </div>
            <div class="stat-card">
                <span class="icon">🔴</span>
                <div class="stat-number">${collectionIndex.collection.brickTypes.regular.count}</div>
                <div class="stat-label">Regular Bricks (10%)</div>
            </div>
            <div class="stat-card">
                <span class="icon">🟡</span>
                <div class="stat-number">${collectionIndex.collection.brickTypes.industrial.count}</div>
                <div class="stat-label">Industrial Bricks (15%)</div>
            </div>
            <div class="stat-card">
                <span class="icon">🟣</span>
                <div class="stat-number">${collectionIndex.collection.brickTypes.legendary.count}</div>
                <div class="stat-label">Legendary Bricks (20%)</div>
            </div>
        </div>
        
        <div class="controls">
            <input type="text" class="search-box" placeholder="Search MetaBricks by number, type, or ID..." id="searchBox">
            <div class="filter-buttons">
                <button class="filter-btn active" data-filter="all">All (${collectionIndex.collection.totalFiles})</button>
                <button class="filter-btn" data-filter="regular">Regular (${collectionIndex.collection.brickTypes.regular.count})</button>
                <button class="filter-btn" data-filter="industrial">Industrial (${collectionIndex.collection.brickTypes.industrial.count})</button>
                <button class="filter-btn" data-filter="legendary">Legendary (${collectionIndex.collection.brickTypes.legendary.count})</button>
            </div>
        </div>
        
        <div class="bricks-grid" id="bricksGrid">
            ${collectionIndex.files.map(file => `
                <div class="brick-card ${file.brickType}" data-type="${file.brickType}" data-number="${file.uploadNumber}">
                    <div class="brick-header">
                        <div class="brick-number">#${file.uploadNumber}</div>
                        <div class="brick-type ${file.brickType}">${file.brickType}</div>
                    </div>
                    <div class="brick-details">
                        <div class="brick-detail">Original ID: ${file.originalBrickId}</div>
                        <div class="brick-detail">File: ${file.fileName}</div>
                        <div class="brick-detail">Size: ${(file.fileSize / 1024).toFixed(1)} KB</div>
                    </div>
                    <div class="brick-actions">
                        <button class="action-btn view-btn" onclick="window.open('${file.pinataUrl}', '_blank')">View JSON</button>
                        <button class="action-btn copy-btn" onclick="copyToClipboard('${file.pinataUrl}')">Copy URL</button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="footer">
            <p>MetaBricks Collection - Uploaded to Pinata Private Group: ${collectionIndex.collection.privateGroup}</p>
            <p>Upload Date: ${collectionIndex.collection.uploadDate}</p>
        </div>
    </div>

    <script>
        // Search functionality
        document.getElementById('searchBox').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const bricks = document.querySelectorAll('.brick-card');
            
            bricks.forEach(brick => {
                const text = brick.textContent.toLowerCase();
                const matches = text.includes(searchTerm);
                brick.style.display = matches ? 'block' : 'none';
            });
        });
        
        // Filter functionality
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                
                // Update active button
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Filter bricks
                const bricks = document.querySelectorAll('.brick-card');
                bricks.forEach(brick => {
                    if (filter === 'all' || brick.dataset.type === filter) {
                        brick.style.display = 'block';
                    } else {
                        brick.style.display = 'none';
                    }
                });
            });
        });
        
        // Copy to clipboard functionality
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                // Show feedback
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                btn.style.background = '#00b894';
                btn.style.color = '#fff !important';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#343BE6';
                    btn.style.color = '#679BFF !important';
                }, 2000);
            });
        }
    </script>
</body>
  </html>`;
}

// Run if executed directly
if (require.main === module) {
    createCollectionIndex();
}

module.exports = {
    createCollectionIndex,
    createHTMLViewer
};
