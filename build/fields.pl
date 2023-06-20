#!/usr/bin/perl
use v5.10.0;
use utf8;
use open qw/:std :utf8/;

sub node {
   $filename = shift;
   chomp $filename;

   $filename =~ m|([^/]+)/([^/]+)\.js$|;

   $componentName = $1;
   $typeName      = $2;

   return if $componentName =~ /^Annotation$/;
   return if $typeName =~ /^X3D/;

   return unless $typeName =~ /^Transform$/;
   say "$componentName $typeName";

   $file = `cat ../x_ite/docs/_posts/components/$componentName/$typeName.md`;

   @fields = $file =~ m|###\s*[SM]F\w+.*|go;

   say $_ foreach @fields;

   #exit;
}

node $_ foreach sort `find ../x_ite/src/x_ite/Components -type f -mindepth 2`;
