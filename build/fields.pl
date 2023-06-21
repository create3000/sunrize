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

   field ($_, $source) foreach @fields
}

sub field {
   $field  = shift;
   $source = shift;

   #say $field;

   $field =~ /###\s*(\w+)\s*\[(.*?)\]\s*\*\*(\w+)\*\*\s*(.*?)(?:\s*<|$)/;

   $type       = $1;
   $accessType = $2;
   $name       = $3;
   $value      = $4;

   return if $accessType eq "in";
   return if $accessType eq "out";

   $source =~ /"$name",\s*new\s+Fields\s*.*?\((.*?)\)/;

   $codeValue = $1;

   if ($type eq "SFBool")
   {
      return if $value eq "TRUE"  && $codeValue eq "true";
      return if $value eq "FALSE" && $codeValue eq "";
   }
   elsif ($type eq "SFColor")
   {
      return if $value eq "0 0 0"       && $codeValue eq "";
      return if $value eq "1 1 1"       && $codeValue eq "1, 1, 1";
      return if $value eq "0.8 0.8 0.8" && $codeValue eq "0.8, 0.8, 0.8";
   }
   elsif ($type eq "SFColorRGBA")
   {
      $value =~s /(\s)/,$1/sgo;

      return if ($value eq "0, 0, 0, 0" && $codeValue eq "") != ($value eq $codeValue);
   }
   else
   {
      return;
   }

   say "$typeName.$name $value <-> $codeValue";
}

node $_ foreach sort `find ../x_ite/src/x_ite/Components -type f -mindepth 2`;
