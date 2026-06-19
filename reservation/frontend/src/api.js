// Thin compatibility shim. The implementation now lives in ./api/ split by
// resource (categories.js, rooms.js, bookings.js, ...) for maintainability,
// but several pages still import with the explicit '.js' extension
// (e.g. `from '../api.js'`), which resolves to this exact file rather than
// falling back to a directory index. Re-exporting here keeps every existing
// import — with or without the extension — working unchanged.
export * from './api/index.js';
