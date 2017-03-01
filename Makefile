#=============================================================================
# Makefile for testing MCI-REGISTRY
#
#=============================================================================

# Disable verbosity
MAKEFLAGS += --silent


# Paths to programs and stuff
NPM := $(shell which npm)
YARN := $(shell which yarn)

ESLINT := ./node_modules/.bin/eslint
MOCHA := ./node_modules/.bin/mocha


#=============================================================================
# Installation/setup rules

uninstall:
	@rm -rf node_modules
	$(NPM) cache clean
	$(YARN) cache clean
.PHONY: uninstall

install:
	$(YARN) install --force
	$(NPM) rebuild
.PHONY: install


#=============================================================================
# Integration and unit test rules


test: lint test_server
.PHONY: test


# Test the Express server and APIs
MOCHAOPTS := --reporter mochawesome --reporter-options reportDir='./test/reports',reportFilename='index',reportTitle='MCI Registry Test Results',inlineAssets=false,enableCode=true,enableCharts=false

test_server:
	NODE_ENV=test node $(MOCHA) ./test/api-test.js $(MOCHAOPTS)
.PHONY: test_server


lint:
	$(ESLINT) --quiet .
.PHONY: lint


lint_fix:
	$(ESLINT) --quiet --fix .
.PHONY: lint_fix
