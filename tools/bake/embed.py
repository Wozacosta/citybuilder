# Re-embed tools/bake/baked.json (written by bake.js) into index.html as window.BAKED.
import json, re, os
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, '..', '..', 'index.html')
s = open(P).read(); o = json.load(open(os.path.join(HERE, 'baked.json')))
blob = json.dumps({'atlas': o['atlas'], 'mask': o['mask'], 'frames': o['frames']}, separators=(',', ':'))
s, n = re.subn(r'window\.BAKED = .*?;\n</script>', lambda m: 'window.BAKED = ' + blob + ';\n</script>', s, count=1, flags=re.S)
assert n == 1; open(P, 'w').write(s); print('embedded', len(s))
