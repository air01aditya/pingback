const linksService = require("../services/links.service");
const HttpError = require("../utils/httpError");
const { baseUrl } = require("../config/env");

function withShortUrl(link) {
  return { ...link, shortUrl: `${baseUrl}/${link.code}` };
}

function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "id must be a positive integer");
  }
  return id;
}

function validateTargetUrl(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, "targetUrl is required");
  }
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new HttpError(400, "targetUrl must be a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new HttpError(400, "targetUrl must start with http:// or https://");
  }
  return url.toString();
}

function validateLabel(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, "label is required (e.g. the company name)");
  }
  if (value.trim().length > 100) {
    throw new HttpError(400, "label must be 100 characters or fewer");
  }
  return value.trim();
}

function list(req, res) {
  res.json(linksService.listLinks().map(withShortUrl));
}

function getOne(req, res) {
  const link = linksService.getLink(parseId(req.params.id));
  if (!link) throw new HttpError(404, "Link not found");
  res.json(withShortUrl(link));
}

function create(req, res) {
  const body = req.body || {};
  const targetUrl = validateTargetUrl(body.targetUrl);
  const label = validateLabel(body.label);

  const link = linksService.createLink({ targetUrl, label });
  res.status(201).json(withShortUrl(link));
}

function remove(req, res) {
  const deleted = linksService.deleteLink(parseId(req.params.id));
  if (!deleted) throw new HttpError(404, "Link not found");
  res.status(204).send();
}

module.exports = { list, getOne, create, remove };
