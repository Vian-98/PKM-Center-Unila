from PIL import Image
p = r'C:\Aidil\PKM-Center-Unila\docs\Digitalisasi Manajemen PKM.png'
im = Image.open(p).convert('RGB')
if im.size[0]:
    w, h = im.size
    im2 = im.resize((256, int(h*(256/w))), Image.BILINEAR)
else:
    im2 = im.resize((256,256), Image.BILINEAR)
colcount = im2.getcolors(maxcolors=im2.size[0]*im2.size[1])
if colcount is None:
    print('ERR')
else:
    colcount.sort(key=lambda x:x[0], reverse=True)
    for item in colcount[:10]:
        n, c = item[0], item[1]
        if isinstance(c, tuple) and len(c) == 3:
            r,g,b = c
        else:
            # fallback
            r,g,b = (0,0,0)
        print('#%02X%02X%02X rgb(%d,%d,%d) count=%d' % (int(r),int(g),int(b),int(r),int(g),int(b),n))
