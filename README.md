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

### To-do
- [ ] Load custom JSON
- [ ] Refactor to make it usable as a library
- [ ] Add support for giant JSONs (currently tested with 2,000,000 cards, about 10,000,000 fields; it takes time for JSON initialization)
- [ ] Add tests

### Completed
- [x] Fast virtual scroll
- [x] Fake scrollbar without size restrictions
- [x] Random JSON generator
- [x] Optimizations, abort controllers, non-blocking JSON generation and search, Travolta
- [x] Tested in Chrome and Firefox (works better in Chrome)
