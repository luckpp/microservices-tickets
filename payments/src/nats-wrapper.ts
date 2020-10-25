import nats, { Stan } from 'node-nats-streaming';

class NatsWrapper {
  private _client?: Stan; // the ? tells TypeScript that this property might be undefined for some period of time

  get client() {
    if (!this._client) {
      throw new Error('Cannot access NATS client before connecting');
    }

    return this._client;
  }

  connect(clusterId: string, clientId: string, url: string) {
    this._client = nats.connect(clusterId, clientId, { url });

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        console.log('Connected to NATS');
        resolve();
      });
      this.client.on('error', (err) => {
        reject(err);
      })
    })
  }
}

export const natsWrapper = new NatsWrapper();