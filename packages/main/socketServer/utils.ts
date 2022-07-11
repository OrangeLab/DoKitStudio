
import * as address from 'address'
import * as portfinder from 'portfinder';
export function getHost() {
  return address.ip()
}

export function getPort() {
  return portfinder.getPortPromise();
}


