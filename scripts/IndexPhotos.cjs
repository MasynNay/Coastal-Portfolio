// Runs before start/build. Only relative public photo URLs enter the slideshow manifest.
const fs=require('fs'),path=require('path');const folder=path.join(__dirname,'../public/slideshow');
fs.mkdirSync(folder,{recursive:true});const photos=fs.readdirSync(folder).filter(name=>/\.(jpe?g|png|webp|gif|avif)$/i.test(name)).sort().map(name=>'/slideshow/'+encodeURIComponent(name));
const file=path.join(folder,'index.json'),content=JSON.stringify(photos,null,2)+'\n';
// Avoid reloading an active game when a build finds the same photo list.
if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content)fs.writeFileSync(file,content);
