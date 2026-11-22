# Needle Change XR - portfolio package

- `index.html` - the case study (single file, images embedded).
- `demo/` - the live WebXR prototype. It must be served over HTTPS (or localhost) for VR.

Host it: drop this folder on GitHub Pages, Netlify or Vercel. To preview locally: `npx serve .` then open the shown URL.
On Meta Quest, open the demo URL in the Quest browser and press "Enter VR".

Before publishing publicly: `demo/models/` contains the client's CAD (converted Line 18 RABS models).
Check your NDA. If they can't be shown, delete `demo/` and change the case study button back to a video or screenshots.
