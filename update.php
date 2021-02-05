<?php
exec("mv cookbook.json _cookbook.json; mv accounts.json _accounts.json");
exec("git fetch");
exec("mv -f _cookbook.json cookbook.json; mv -f _accounts.json accounts.json");
?>
