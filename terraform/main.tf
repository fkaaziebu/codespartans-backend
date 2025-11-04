terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  required_version = ">= 1.5.0"
}

provider "aws" {
  region = "eu-central-1"
}

#######################
# VPC & Networking
#######################
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "codespartans-vpc"
  }
}

resource "aws_subnet" "backend_subnet" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "172.16.10.0/24"
  availability_zone       = "eu-central-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "codespartans-subnet"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "codespartans-igw"
  }
}

resource "aws_route_table" "backend_subnet_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "codespartans-rt"
  }
}

resource "aws_route_table_association" "backend_subnet_assoc" {
  subnet_id      = aws_subnet.backend_subnet.id
  route_table_id = aws_route_table.backend_subnet_rt.id
}

#######################
# Security Groups
#######################
resource "aws_security_group" "backend_subnet_security_group" {
  vpc_id = aws_vpc.main.id

  name        = "codespartans-sg"
  description = "Allow SSH, HTTP, Postgres, Redis"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3002
    to_port     = 3002
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3003
    to_port     = 3003
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "codespartans-security-group"
  }
}

#######################
# EC2 Instance
#######################
resource "aws_key_pair" "codespartans" {
  key_name   = "codespartans-backend-key"
  public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDLEBGmiQjBPwM+uSeIHL2143GzOFTB756Z2LNvU8fiurflko5AvGdOhkQ3ChpKU969fX4TunEGag+Y0yBpgNvGhcw63AcV2XqHcW8RkzITCTBNaJ32fxB2yYBH+DbNEqGlGLyCD0IomOI+v03KlmXKOiwNyT7nStURaOsdtWr0wvMwy2WM8T7lRIJCRNLuOwtLi033ZkL0ve8nQICk+5r9u9JVqDrYLvPlMLhU9E1wxSfiG6WOnJat3kJiBeJK4R7xs1hbcDBAeQ9tlLNcR1iPnVy+3KVg4YxX7wu7C+aLWb6QrHSows6SYLYbHD8dx/GXxEfzVkjKZdb4RUFfuYWhfF55ku2S3uhJY81cqlL+f71NpipdzwV9G93bEZQOYnyih+KkSBC5t7ZvDw16FjTOk4cwaMxWFJw7vq5TUBM7DLyvZfhLGw+QQWBuP4mT0M75I77I6EjvuFjTRfh5OWD9+1ROc9/yrIk1syGI56kXV8+WLPI/iCLAhcqbNz7gLuIW/LfQmO+lwZIE/sjiZlGX1UDqJZ5CJzmcp4YQc+pXNReOkfSB2C4VUe/Ny8X0CdNhmABBxe7WsP4q1Ffo8htBCvN1hbKJ2QyfvUlrkd3CzG5tSa7lAcERkK6FHKTwTqcFp7wrRKN9hVAtbAcLfS+7EwHimqUR6rnfWc/wEpd6fQ== frederickaziebu1998@gmail.com"
}

resource "aws_launch_template" "codespartans_temp" {
  name_prefix            = "codespartans-app-"
  image_id               = "ami-0eb9b279f934fd0bd"
  key_name               = aws_key_pair.codespartans.id
  instance_type          = "t4g.micro"
  vpc_security_group_ids = [aws_security_group.backend_subnet_security_group.id]

  monitoring {
    enabled = true
  }

  user_data = filebase64("${path.module}/test_script.sh")

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "backend_instance" {
  launch_template {
    id = aws_launch_template.codespartans_temp.id
  }
}
