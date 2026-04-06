SHELL := /bin/bash
COMPOSE_FILE ?= -f build/docker-compose/docker-compose-local.yml

.PHONY: build shell test test-parser check-parser test-generator test-e2e image-mcp

DEV_RUN = docker compose $(COMPOSE_FILE) run --rm dev bash -lc

build:
	docker compose $(COMPOSE_FILE) build

shell:
	docker compose $(COMPOSE_FILE) run --rm dev

test:
	$(DEV_RUN) 'cd /app && ./scripts/test.sh'

test-parser:
	$(DEV_RUN) 'cd /app && npm --prefix parser test'

check-parser:
	$(DEV_RUN) 'cd /app && npm --prefix parser run check'

test-generator:
	$(DEV_RUN) 'cd /app && mvn -q -f generator/pom.xml test'

test-e2e:
	$(DEV_RUN) 'cd /app && ./scripts/test-e2e.sh'

image-mcp:
	docker build -t markdown-to-confluence-drawio-mcp:local .
