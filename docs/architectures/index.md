---
title: Reference Architectures
sidebar_position: 1
---

Ingested from architecture.cncf.io.

## Latest Architectures

- [Adobe](#adobe)
- [Allianz Direct](#allianz)
- [CERN](#cern)
- [Flipkart](#flipkart)
- [Swisscom Telco](#swisscom-telco)
- [Swisscom Kubernetes](#swisscom-k8s)
- [ZEISS](#zeiss)

---

## Adobe {#adobe}

**Scaling Adobe’s Service Delivery Foundation with a Cell-based Architecture**

- **Industries:** Software, Digital Experience
- **Organization:** Adobe
- **Team:** Developer Platforms

### Synopsis
Adobe has built a scalable service delivery foundation using a cell-based architecture on Kubernetes.

### Relevant CNCF projects
- **Kubernetes:** Fleet management across multiple regions.
- **Argo CD:** GitOps-based delivery.
- **Ethos:** Adobe's internal platform built on Kubernetes.

---

## Allianz Direct {#allianz}

**Enabling Allianz Direct's scaling through Platform Engineering**

- **Industries:** Financial, Insurance
- **Tags:** Finance, Insurance, Europe, Public_cloud, Aws
- **Organization:** Allianz Direct
- **Team:** DevOps

### Platform Engineering Architecture
The PE team delivered several cloud native best practices:
- GitOps (ORGops to be more precise)
- Stateless clusters orchestrated by a management cluster
- Fargate ECS multitenancy
- DevSecOps
- SRE

### Relevant CNCF projects
- **Kubernetes:** Foundation for our Internal Developer Platform.
- **Helm:** Package manager to abstract complexity.
- **Argo:** Using Argo CD for multitenant implementation.

---

## CERN {#cern}

**A Cloud Native Scientific Computing Platform for CERN NextGen AI**

- **Industries:** Research, Switzerland
- **Organization:** CERN
- **Team:** Platforms Infrastructure

### Relevant CNCF projects
- **Kubernetes:** Core compute platform.
- **KubeVirt:** Running virtual machines alongside containers.
- **Prometheus:** Monitoring the massive scientific data processing.

---

## Flipkart {#flipkart}

**From Afterthought to Practice: Flipkart’s Multi-Tenant Chaos Engineering Platform on LitmusChaos**

- **Industries:** E-Commerce, Retail, Digital Commerce
- **Tags:** Chaos Engineering, Resilience, Kubernetes, Multi-Tenancy, India, Site Reliability
- **Organization:** Flipkart Internet Pvt. Ltd.
- **Team:** Central Reliability Engineering

### Synopsis
Centralized chaos engineering platform built on LitmusChaos to convert chaos engineering from an afterthought into a continuous practice.

### Relevant CNCF projects
- **LitmusChaos:** Central chaos engineering platform. Provides Kubernetes-native chaos orchestration.
- **Argo Workflows:** Underlying workflow engine used by Litmus to model multi-step chaos experiments.
- **Prometheus:** Metrics backbone for both production workloads and chaos experiments.

---

## Swisscom Telco {#swisscom-telco}

**End-to-End Cloud Native Telco Platform Automation at Swisscom**

- **Industries:** Communication, Private_cloud
- **Organization:** Swisscom (Switzerland) Ltd
- **Team:** Mobile

### Relevant CNCF projects
- **Kubernetes:** Foundation for the telco platform.
- **Cluster API:** Lifecycle management of Kubernetes clusters.
- **Crossplane:** Cloud infrastructure management via K8s APIs.

---

## Swisscom Kubernetes {#swisscom-k8s}

**A modern and sovereign Private Cloud «Kubernetes Service» for Swiss-based enterprises.**

- **Industries:** Communication, Switzerland
- **Organization:** Swisscom (Switzerland) Ltd
- **Team:** Cloud Native Solutions

### Relevant CNCF projects
- **Kubernetes:** Providing managed K8s services.
- **Cilium:** Networking and security.
- **Harbor:** Container registry.

---

## ZEISS Vision Care {#zeiss}

**ZEISS Vision Care - Order Fulfillment**

- **Industries:** Optics, Optical-Manufacturing
- **Tags:** Public-Cloud, Mass-Manufacturing, Microservices, Platform Engineering
- **Organization:** ZEISS
- **Team:** Business Enablement & IT

### Synopsis
Reworking the order fulfillment process using a greenfield approach to modernize core systems.

### Relevant CNCF projects
- **Kubernetes (AKS):** Hosts > 200 microservices supporting order fulfillment.
- **Dapr:** Provides service invocation, pub/sub, and state management.
- **KEDA:** Event-driven scaling based on Azure Service Bus queue depth.
- **OpenTelemetry:** Consistent instrumentation and telemetry exports.
