import {Response} from "express";

const success = (res: Response, data?: unknown) => {
  const response: Record<string, unknown> = {success: true};
  if (data) {
    response.data = data;
  }
  res.status(200).send(response);
};

const error400 = (res: Response, message?: unknown) => {
  const response: Record<string, unknown> = {success: false};
  if (message) {
    response.message = message;
  }
  res.status(400).send(response);
};

const error500 = (res: Response, message?: unknown) => {
  const response: Record<string, unknown> = {success: false};
  if (message) {
    response.message = message;
  }
  res.status(500).send(response);
};

export default {success, error400, error500};
