#!/bin/bash
cp cookbook.json _cookbook.json
cp accounts.json _accounts.json
git pull
mv -f _cookbook.json cookbook.json
mv -f _accounts.json accounts.json
