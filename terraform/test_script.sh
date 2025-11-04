#!/bin/bash
set -e

# Update system
sudo dnf update -y

# Install Docker
sudo dnf install -y docker

# Start & enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group (so we can run docker without sudo)
sudo usermod -aG docker ec2-user

# Install Docker Compose v2 (plugin-based in AL2023)
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# Verify installation
docker --version
docker compose version
