const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/fashionhub365';
    await mongoose.connect(uri);
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    const products = await db.collection('products').find({}).toArray();
    
    let updated = 0;
    for (const p of products) {
      let changed = false;
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach(v => {
          if (!v._id) {
            v._id = new mongoose.Types.ObjectId();
            changed = true;
          }
        });
      }
      if (p.media && Array.isArray(p.media)) {
        p.media.forEach(m => {
          if (!m._id) {
            m._id = new mongoose.Types.ObjectId();
            changed = true;
          }
        });
      }
      
      if (changed) {
        await db.collection('products').updateOne(
          { _id: p._id }, 
          { $set: { variants: p.variants, media: p.media } }
        );
        updated++;
      }
    }
    console.log('Thanh cong! Da cap nhat _id cho ' + updated + ' san pham.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
