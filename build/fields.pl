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

   foreach $field (@fields)
   {
      say $field;

      $field =~ /###\s*(\w+)\s*\[.*?\]\s*\*\*(\w+)\*\*\s*(.*?)(?:\s*<|$)/;

      $type  = $1;
      $name  = $2;
      $value = $3;

      say "$1 $2 $3";
   }

   #exit;
}

node $_ foreach sort `find ../x_ite/src/x_ite/Components -type f -mindepth 2`;
