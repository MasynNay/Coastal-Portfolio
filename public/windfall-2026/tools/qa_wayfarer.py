"""Self-contained headless browser smoke test. Avoid navigation to blocked URLs.
The page is rendered from set_content and same-origin asset fetches are mocked
with exact local file bytes: production runtime is otherwise unchanged."""
import asyncio, json, base64, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=False,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--no-proxy-server'])
        page=await browser.new_page(viewport={'width':800,'height':500},device_scale_factor=1)
        errors=[];console=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda msg:console.append(msg.text) if msg.type=='error' else None)
        missing_hero=os.getenv("WINDFALL_TEST_MISSING_HERO")=="1"
        async def read_asset(url):
            rel=url.split('?')[0].strip('/')
            if missing_hero and rel.endswith('windfall-wayfarer.glb'): raise FileNotFoundError('Deliberately missing hero fixture')
            dest=(ROOT/rel).resolve()
            if not dest.is_file() or not dest.is_relative_to(ROOT): raise FileNotFoundError(rel)
            return base64.b64encode(dest.read_bytes()).decode('ascii')
        await page.expose_function('__assetTestRead',read_asset)
        html=(ROOT/'index.html').read_text().replace('<script src="asset-pipeline.js"></script>','').replace('<script src="main.js"></script>','')
        await page.set_content(html,wait_until='domcontentloaded')
        await page.evaluate("""()=>{window.fetch=async (url)=>{const b64=await window.__assetTestRead(String(url));const raw=atob(b64),data=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)data[i]=raw.charCodeAt(i);return new Response(data,{status:200});}}""")
        await page.add_script_tag(content=(ROOT/'asset-pipeline.js').read_text())
        await page.add_script_tag(content=(ROOT/'main.js').read_text())
        await page.wait_for_function("document.documentElement.dataset.windfallReady==='1'",timeout=60000)
        await page.wait_for_function("document.documentElement.dataset.windfallAssetStatus!==undefined",timeout=70000)
        state=await page.evaluate("""()=>({ready:document.documentElement.dataset.windfallReady,count:document.documentElement.dataset.windfallAssets,assets:document.documentElement.dataset.windfallAssetStatus,error:document.getElementById('error').textContent,gl:document.getElementById('scene').getContext('webgl2').getError()})""")
        print('INITIAL',json.dumps(state)[:3500]); print('ERRORS',errors[:8],console[:8])
        await page.screenshot(path=str(ROOT/'wayfarer-before.png'))
        await page.keyboard.down('w');await page.wait_for_timeout(1000);await page.keyboard.up('w')
        await page.screenshot(path=str(ROOT/'wayfarer-qa.png'))
        after=await page.evaluate("""()=>({gl:document.getElementById('scene').getContext('webgl2').getError(),assets:document.documentElement.dataset.windfallAssets})""")
        print('AFTER_MOVE',after,'JS_ERRORS',errors[:8]);
        await browser.close()
        loaded=json.loads(state['assets'])
        if missing_hero:
            assert len(loaded)==6 and sum(item['loaded'] for item in loaded)==5 and not next(item for item in loaded if item['id']=='windfall-wayfarer')['loaded']
        else:
            assert all(item['loaded'] for item in loaded),state['assets']
        assert state['gl']==0 and after['gl']==0
        assert not errors
        from PIL import Image,ImageChops
        before=Image.open(ROOT/'wayfarer-before.png').convert('RGB')
        afterimg=Image.open(ROOT/'wayfarer-qa.png').convert('RGB')
        import numpy as np
        difference=np.mean(np.abs(np.asarray(before).astype(int)-np.asarray(afterimg).astype(int)))
        print('MOVEMENT_PIXEL_DELTA',round(float(difference),3),'fallback?',missing_hero)
        assert difference>0.05, 'Player movement made no visible change' 

asyncio.run(main())
