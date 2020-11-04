# Infrastructure

This folder contains files that are used to configure our project's infrastructure.

## Kubernetes configuration

The following folders contain configuration files for Kubernetes:

- `infra/k8s`: configuration files for any given cluster (be it **dev** or **prod**)
- `infra/k8s-dev`: configuration files only for **dev** cluster
- `infra/k8s-prod`: configuration files only for **dev** cluster

## Kubernetes secrets

### Local Kubernetes cluster

In order to define the Kubernetes secrets on the local cluster run the following commands:

- `$ kubectl create secret generic jwt-secret --from-literal=JWT_KEY={the_jwt_key}`
- `$ kubectl create secret generic stripe-secret --from-literal=STRIPE_KEY={the_stripe_api_private_key}`

### Digital Ocean Kubernetes cluster

In order to define the Kubernetes secrets on the local cluster run the following commands:

- `$ kubectl config get-contexts`
- `$ kubectl config use-context {name_of_digital_ocean_k8s_context}`
- `$ kubectl get nodes` (just to verify that the context has been changed)
- `$ kubectl config view` (just to view your configuration file)
- `$ kubectl create secret generic jwt-secret --from-literal=JWT_KEY={the_jwt_key}`
- `$ kubectl create secret generic stripe-secret --from-literal=STRIPE_KEY={the_stripe_api_private_key}`
