<?php
if (isset($_POST["username"]) && isset($_POST["password"])) {
    $accounts = json_decode(file_get_contents("accounts.json"), true);
    if (!isset($accounts[$_POST["username"]])) {
        if (isset($_POST["create"])) {
            $accounts[$_POST["username"]] = createHash($_POST["password"]);
            file_put_contents("accounts.json", json_encode($accounts));
            die("true");
        }
        die("null");
    }
    $valid = createHash($_POST["password"]) == $accounts[$_POST["username"]];
    if ($valid && isset($_POST["save"])) {
        $cookbook = json_decode(file_get_contents("cookbook.json"), true);
        if (!isset($cookbook[$_POST["save"]])) {
            $cookbook[$_POST["save"]] = json_decode('{"ingredients":[],"owner":"' . $_POST["username"] . '","score":{}}');
        } elseif ($cookbook[$_POST["save"]]["owner"] == $_POST["username"]) {
            if (isset($_POST["score"])) {
                $cookbook[$_POST["save"]]["score"][$_POST["username"]] = $_POST["score"];
            } elseif (isset($_POST["ingredients"])) {
                $cookbook[$_POST["save"]]["ingredients"] = [];
                foreach (json_decode($_POST["ingredients"], true) as $key => $ingredient) {
                    array_push($cookbook[$_POST["save"]]["ingredients"], $ingredient);
                }
            }
        } else {
            die("false");
        }
        file_put_contents("cookbook.json", json_encode($cookbook));
    } else {
        var_export($valid);
    }
}

function createHash($string)
{
    return sha1($string . "hashed");
}
