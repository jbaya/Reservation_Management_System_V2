// Wraps an async route/controller handler so a thrown error or rejected
// promise is forwarded to next(err) automatically. Removes the repeated
// try/catch -> next(error) boilerplate that used to be copy-pasted (or, in
// some old routes, just skipped entirely) in every handler.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
