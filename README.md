# Hello

Here you can find a JS implementation of virtual-scroll.

Made for fun. 

The implementation is framework-agnostic; here it's used with React, but React is not necessary for it.

<img src="public/img.png" alt="virtual-scroll screen" title="virtual-scroll screen" style="max-width: 800px;">


## HOW TO RUN

```
npm install
npm run dev
```

## ISSUES

- I used standard browser scroll which has vertical size restrictions. 
So if you generate a very big JSON with one million cards, for example - it will work, but the browser will not show the entire list.

- Performance improvements, especially with enabled search, are possible. The current version is not fully optimized.

- Developed for chrome