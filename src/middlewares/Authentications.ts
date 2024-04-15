import express from 'express';

const promise = (): Promise<string> => new Promise((resolve, reject) => {
  setTimeout(() => {
    const message = "======Authentication Called !!!!!======";
    resolve(message);
  }, 3000);
});

export default async function (req: express.Request, _R: express.Response, next: express.NextFunction) {
  try {
    const data = await promise();
    req.message = data;
    next();
  } catch (error) {
    next(error);
  }
}