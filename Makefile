UI = bdd
REPORTER = dot
REQUIRE = --require tests/helper.js
RUNNER = ./node_modules/.bin/_mocha
DEBUGGER = node --debug ./node_modules/.bin/_mocha
LINT = ./node_modules/.bin/jshint
WATCH =
TESTS = $(shell find tests/unit -name "*.spec.js")
KARMA = ./node_modules/karma/bin/karma
GULP = ./node_modules/gulp/bin/gulp.js
GRUNT = ./node_modules/grunt-cli/bin/grunt
ISTANBUL = ./node_modules/istanbul/lib/cli.js

red=`tput setaf 1`
normal=`tput sgr0`

all: build

install:
	@npm install --loglevel error

build: install lint test
	@$(GULP) scripts

lint:
	@$(GRUNT) lint

test:
	@NODE_PATH=$(shell pwd)/public $(RUNNER) --ui $(UI) --reporter $(REPORTER) $(REQUIRE) $(WATCH) $(TESTS)

unit:
	@make test TESTS="$(shell find tests/unit -name "*.spec.js")"

watch-node:
	@make unit REPORTER=spec WATCH=--watch

watch:
	@$(GULP) tests watch

debug:
	@echo "Start ${red}node-inspector${normal} if not running already"
	@make unit WATCH=--watch RUNNER="$(DEBUGGER)"

coverage:
	@NODE_PATH=$(shell pwd)/public $(ISTANBUL) cover $(RUNNER) $(REQUIRE) $(TESTS)

clean:
	@rm -f build/*.js

karma:
	@$(GULP) tests
	@$(KARMA) start karma/conf.js

server:
	@$(GULP) tests watch server

start: install server

documentation:
	rm -rf ./docs/*
	./node_modules/.bin/jsdoc -c ./jsdoc.conf.json

.PHONY: coverage build karma
