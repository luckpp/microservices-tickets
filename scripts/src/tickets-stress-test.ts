import axios from 'axios';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const cookie =
  'express:sess=eyJqd3QiOiJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKcFpDSTZJalZtT0dRM1l6ZzRZVFpoTVRObE1EQXlOVGMwT0dSbVlpSXNJbVZ0WVdsc0lqb2lkR1Z6ZEVCMFpYTjBMbU52YlNJc0ltbGhkQ0k2TVRZd016RXdOemszTm4wLkdXdkF5UEpJM0V5azNVRVR5ekszZTdUcGhGS2JnbUN4MzU0RURGSWlpbnMifQ==; Path=/; Domain=tickets.dev; Secure; HttpOnly;';

const doRequest = async () => {
  const { data } = await axios.post(
    'https://tickets.dev/api/tickets',
    { title: 'ticket', price: 5 },
    {
      headers: { cookie },
    }
  );

  await axios.put(
    `https://tickets.dev/api/tickets/${data.id}`,
    { title: 'ticket', price: 10 },
    {
      headers: { cookie },
    }
  );

  await axios.put(
    `https://tickets.dev/api/tickets/${data.id}`,
    { title: 'ticket', price: 15 },
    {
      headers: { cookie },
    }
  );
};

(async () => {
  for (let count = 0; count < 400; count++) {
    doRequest();
  }
})();
