from pathlib import Path
import base64,json,time
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=False,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox'])
 page=b.new_page(viewport={'width':160,'height':120});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<canvas id="c" width="160" height="120"></canvas>')
 page.add_script_tag(content=(root/'asset-pipeline.js').read_text())
 for name in ('windfall-timber-cottage','windfall-harbor-workshop'):
  encoded=base64.b64encode((root/'models'/f'{name}.glb').read_bytes()).decode()
  manifest=json.loads((root/'asset-manifest.json').read_text());entry=next(x for x in manifest['assets'] if x['id']==name)
  entry['instances']=[{'position':[0,0,0],'scale':1.0,'rotationY':0}]
  res=page.evaluate('''async p=>{
    const bytes=Uint8Array.from(atob(p.base64),c=>c.charCodeAt(0));
    const gl=document.querySelector('canvas').getContext('webgl2');
    window.__assetPipeline=window.__assetPipeline||window.WindfallAssetPipeline.create(gl);
    const n=await window.__assetPipeline.addGLB(bytes.buffer,p.entry);
    return {meshCount:n,error:gl.getError(),status:window.__assetPipeline.getStatus(),loaded:window.__assetPipeline.hasLoaded(p.entry.id),collides:window.__assetPipeline.collides(0,0)};
  }''',{'base64':encoded,'entry':entry})
  print(name,res,flush=True)
 print('JavaScript errors',errors,flush=True)
 b.close()
