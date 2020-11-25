eval $(minikube -p minikube docker-env)
docker login
docker build -t luckpp/auth ./auth
docker build -t luckpp/client ./client
docker build -t luckpp/expiration ./expiration
docker build -t luckpp/orders ./orders
docker build -t luckpp/payments ./payments
docker build -t luckpp/tickets ./tickets
docker pull nats-streaming:0.17.0
docker pull mongo:4.4.1
docker pull redis
