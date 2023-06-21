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

   #return unless $typeName =~ /^Transform$/;
   #say "$componentName $typeName";

   $file   = `cat ../x_ite/docs/_posts/components/$componentName/$typeName.md`;
   $source = `cat $filename`;

   @fields = $file =~ m|###\s*[SM]F\w+.*|go;

   foreach $field (@fields)
   {
      #say $field;

      $field =~ /###\s*(\w+)\s*\[(.*?)\]\s*\*\*(\w+)\*\*\s*(.*?)(?:\s*<|$)/;

      $type       = $1;
      $accessType = $2;
      $name       = $3;
      $value      = $4;

      $source =~ /"$name",\s*new\s+Fields\s*.*?\((.*?)\)/;

      $codeValue = $1;

      if ($type eq "SFBool")
      {
         say "$typeName.$name $value <-> $codeValue" if $value eq "TRUE"  && $codeValue ne "true";
         say "$typeName.$name $value <-> $codeValue" if $value eq "FALSe" && $codeValue ne "";
      }
      elsif ($type eq "SFColor")
      {
         say "$typeName.$name $value <-> $codeValue" if $value eq "0 0 0"  && $codeValue ne "";
         say "$typeName.$name $value <-> $codeValue" if $value eq "1 1 1" && $codeValue ne "1, 1, 1";
         say "$typeName.$name $value <-> $codeValue" if $value eq "0.8 0.8 0.8" && $codeValue ne "0.8, 0.8, 0.8";
      }
   }
}

node $_ foreach sort `find ../x_ite/src/x_ite/Components -type f -mindepth 2`;
