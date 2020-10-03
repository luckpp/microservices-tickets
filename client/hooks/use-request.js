import axios from 'axios';
import { useState } from 'react';

/**
 * @param { string } url the URL to make the request to
 * @param { string } method we assume that it will be equal to 'get', 'post', 'put', ...
 * @param { object } body the body of the request
 * @param { Function } onSuccess callback for when the request succeeds
 */
export default ({ url, method, body, onSuccess }) => {
  const [errors, setErrors] = useState();

  const doRequest = async () => {
    try {
      // reset errors to null in case is already used by somebody from outside the function
      setErrors(null);
      const response = await axios[method](url, body);
      if (onSuccess) {
        onSuccess(response.data);
      }
      return response.data;
    } catch (err) {
      setErrors(
        <div className="alert alert-danger">
          <h4>Ooops...</h4>
          <ul className="my-0">
            {/* only the errors from the api are treated! make sure to tret all error types */}
            {err.response.data.errors.map((err) => (
              <li key={err.message}>{err.message}</li>
            ))}
          </ul>
        </div>
      );
    }
  };

  // in this case makes more sense of returning an object instead of returning an array as usual React hooks
  return { doRequest, errors };
};
