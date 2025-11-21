// Bulk add creative backgrounds to all HTML files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const htmlFiles = [
  'contact.html', 'login.html', 'signup.html', 'profile.html', 
  'location.html', 'orderhistory.html', 'faq.html', 'account.html',
  'forgot-password.html', 'language.html', 'maintenance.html',
  'products.html', 'register.html', 'shop-new.html'
];

htmlFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add CSS link if not exists
    if (!content.includes('creative-backgrounds.css')) {
      content = content.replace(
        /<\/head>/,
        '  <link rel="stylesheet" href="creative-backgrounds.css">\n</head>'
      );
    }
    
    // Add JS script if not exists
    if (!content.includes('bg-init.js')) {
      content = content.replace(
        /<\/body>/,
        '  <script src="bg-init.js"></script>\n</body>'
      );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});

console.log('All HTML files updated with creative backgrounds!');