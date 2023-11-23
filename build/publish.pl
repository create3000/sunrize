#!/usr/bin/perl
use strict;
use warnings;
use v5.10.0;
use utf8;
use open qw/:std :utf8/;

if (`git branch --show-current` ne "development\n")
{
	say "Wrong branch, must be development, cannot release version!";
	exit 1;
}

# merge
system "git", "checkout", "main";
system "git", "merge", "development";

# version
my $name = `node -p "require('./package.json').name"`;
chomp $name;

my $version = `npm pkg get version | sed 's/"//g'`;
chomp $version;
say "package.json version $version";

my $online = `npm view $name version`;
chomp $online;
say "NPM version $online";

system "npm version patch --no-git-tag-version --force" if $version eq $online;
system "npm i x_ite\@latest";

# commit
system "git", "add", "-A";
system "git", "commit", "-am", "Published version $version";
system "git", "push", "origin";

# tag
system "git", "tag", "--delete", $version;
system "git", "push", "--delete", "origin", $version;
system "git", "tag", $version;
system "git", "push", "origin", "--tags";

# npm
system "npm", "publish";

# development
system "git", "checkout", "development";
system "git", "merge", "main";
system "git", "push", "origin";
