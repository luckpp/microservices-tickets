import { useEffect, useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { doRequest, errors } = useRequest({
    url: '/api/payments',
    method: 'post',
    body: {
      orderId: order.id,
    },
    onSuccess: (payment) => console.log('Payment created:', payment),
  });

  // When the component first renders we want to call the wrapped function only one time. This is the reason
  // for using the `useEffect` hook
  useEffect(() => {
    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };

    // `findTimeLeft` is invoked immediately in order not to wait for the interval 1000 ms to elapse and only after display
    // the time left
    findTimeLeft();

    const timerId = setInterval(findTimeLeft, 1000);

    // If we return a function from `useEffect`, that function will be invoked:
    // - when we are about to navigate away from this component,
    // - or will be invoked when the component will going to be re-rendered (but for this case we will have
    //   to provide a dependency inside the config array [] of the `useEffect`)
    return () => {
      clearInterval(timerId);
    };
  }, []); // We add [] to make sure that the wrapped function is called when the components gets displayed on the screen
  // In case we get an warning inside the browser we will have to use [order] instead of []

  if (timeLeft < 0) {
    return <div>Order expired</div>;
  }

  return (
    <div>
      Time left to pay: {timeLeft} seconds
      {/* For the current implementation we store the Stripe Key inside the react app. It would be recommended to
          store it as an environment variable or even as a Kubernetes secret. */}
      <StripeCheckout
        token={({ id }) => doRequest({ token: id })}
        stripeKey="pk_test_51HgnuUEL5IIc4jWwEvItLqueIxjc9MDuAvi3Qv1WbGECVpGGhdlmOqN3RAMHQehFbaFuNi0C8F4SJ3NiX7h6RUOa00u4UaLLuX"
        amount={order.ticket.price * 100}
        email={currentUser.email}
        currency="RON"
      />
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);

  return { order: data };
};

export default OrderShow;
