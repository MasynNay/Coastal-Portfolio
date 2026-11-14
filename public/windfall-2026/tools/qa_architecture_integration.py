"""End-to-end architecture validation, including partial download failure fallback."""
from pathlib import Path
import base64,json,time
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text().replace('<script src="asset-pipeline.js"></script>','').replace('<script src="main.js"></script>','')
assets={f.name:base64.b64encode(f.read_bytes()).decode('ascii') for f in (root/'models').glob('*.glb')}
manifest=json.loads((root/'asset-manifest.json').read_text())
assert len(manifest['assets'])==4
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist'])
 for name,missing in [('all-assets',None),('workshop-offline','windfall-harbor-workshop.glb'),('cottage-offline','windfall-timber-cottage.glb')]:
  page=browser.new_page(viewport={'width':440,'height':265},device_scale_factor=1)
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(html,wait_until='load',timeout=30000)
  page.add_script_tag(content=(root/'asset-pipeline.js').read_text())
  page.evaluate('''data=>{
   const files={};for(const [name,encoded] of Object.entries(data.blobs))files[name]=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
   window.fetch=async url=>{
    if(url==='asset-manifest.json')return {ok:true,json:async()=>data.manifest};
    if(url.startsWith('models/')&&files[url.slice(7)]&&url.slice(7)!==data.missing)return {ok:true,arrayBuffer:async()=>files[url.slice(7)].buffer.slice(0)};
    return {ok:false,status:404};
   };
  }''',{'manifest':manifest,'blobs':assets,'missing':missing})
  page.add_script_tag(content=(root/'main.js').read_text())
  page.wait_for_function("document.documentElement.dataset.windfallReady === '1' && document.documentElement.dataset.windfallAssets !== undefined",timeout=40000)
  status=page.evaluate('''()=>({assets:Number(document.documentElement.dataset.windfallAssets),loaded:JSON.parse(document.documentElement.dataset.windfallAssetStatus),error:document.querySelector('#error').textContent,canvas:document.querySelector('canvas').width})''')
  assert not errs and not status['error'],(name,errs,status)
  assert status['assets']==(3 if missing else 4),(name,status)
  failed=[x for x in status['loaded'] if not x['loaded']]
  assert len(failed)==(1 if missing else 0),(name,failed)
  print(name,{'loaded':status['assets'],'failed':[x['id'] for x in failed],'jsErrors':len(errs),'canvasWidth':status['canvas']},flush=True)
  page.close()
 browser.close()
