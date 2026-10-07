from PIL import Image
p = r'C:\Aidil\PKM-Center-Unila\docs\Digitalisasi Manajemen PKM.png'
im = Image.open(p).convert('RGB')
if im.size[0]:
    w, h = im.size
    im2 = im.resize((256, int(h*(256/w))), Image.BILINEAR)
else:
    im2 = im.resize((256,256), Image.BILINEAR)
colcount = im2.getcolors(maxcolors=im2.size[0]*im2.size[1])
colcount.sort(key=lambda x:x[0], reverse=True)
for c,n in colcount[:10]:
    r,g,b = c
    print('#%02X%02X%02X rgb(%d,%d,%d) count=%d' % (r,g,b,r,g,b,n))
