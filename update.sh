#!/bin/bash
mv cookbook.json _cookbook.json
mv accounts.json _accounts.json
git fetch
mv -f _cookbook.json cookbook.json
mv -f _accounts.json accounts.json
