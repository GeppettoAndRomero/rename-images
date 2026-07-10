# Test fixtures

`red.jpg`, `green.png`, and `blue.jpg` are 8×8 solid-color images generated in-repo with
Pillow (no third-party image, no personal data). They carry no third-party copyright and
are safe to ship in this open-source repo. Two extensions (`.jpg`/`.png`) and mixed case
are used deliberately, so e2e tests can assert the extension is preserved regardless of
what it originally was. Regenerate with:

```python
from PIL import Image
Image.new("RGB", (8, 8), (255, 0, 0)).save("red.jpg", "JPEG")
Image.new("RGB", (8, 8), (0, 255, 0)).save("green.png", "PNG")
Image.new("RGB", (8, 8), (0, 0, 255)).save("blue.jpg", "JPEG")
```
