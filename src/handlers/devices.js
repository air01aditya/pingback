import { HttpError, json } from "../lib/http.js";
import { COOKIE_NAME, clearedDeviceCookie, deviceCookie, readCookie } from "../lib/auth.js";
import { positiveInt } from "../lib/validate.js";
import { deleteDevice, listDevices } from "../services/devices.js";

export function me({ request, device }) {
  const token = readCookie(request, COOKIE_NAME);
  return json({ name: device.name }, 200, { "Set-Cookie": deviceCookie(token) });
}

export async function list({ env, device }) {
  const devices = await listDevices(env.DB);
  return json({ devices: devices.map((d) => ({ ...d, current: d.id === device.id })) });
}

export async function remove({ env, params, device }) {
  const id = positiveInt(params.id, "Device id");
  if (!(await deleteDevice(env.DB, id))) throw new HttpError(404, "Device not found");

  const headers = id === device.id ? { "Set-Cookie": clearedDeviceCookie() } : {};
  return json({ removed: id }, 200, headers);
}
