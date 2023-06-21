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

   $source =~ /X3DFieldDefinition.*?"$name",\s*new\s+Fields\s*.*?\((.*?)\)\),/;

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
   elsif ($type eq "SFDouble")
   {
      return if $value eq "0" && $codeValue eq "";
      return if $value eq $codeValue;
   }
   elsif ($type eq "SFFloat")
   {
      return if $value eq "0" && $codeValue eq "";
      return if $value eq $codeValue;
      return if $value eq "π/2" && $codeValue eq "1.5708";
      return if $value eq "π/4" && $codeValue eq "0.785398";
      return if $value eq "π" && $codeValue eq "3.14159";
      return if $value eq "-π" && $codeValue eq "-3.14159";
   }
   elsif ($type eq "SFImage")
   {
      $value =~s /(\s)/,$1/sgo;

      return if $value eq "0, 0, 0" && $codeValue eq "";
   }
   elsif ($type eq "SFInt32")
   {
      return if $value eq "0" && $codeValue eq "";
      return if $value eq $codeValue;
   }
   elsif ($type =~ /^(?:SFMatrix3d|SFMatrix3f)$/)
   {
      $value =~s /(\s)/,$1/sgo;

      return if $value eq "1, 0, 0, 0, 1, 0, 0, 0, 1" && $codeValue eq "";
   }
   elsif ($type =~ /^(?:SFMatrix4d|SFMatrix4f)$/)
   {
      $value =~s /(\s)/,$1/sgo;

      return if $value eq "1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1" && $codeValue eq "";
   }
   elsif ($type eq "SFNode")
   {
      return if $value eq "NULL" && $codeValue eq "";
   }
   elsif ($type eq "SFRotation")
   {
      return if $value eq "0 0 1 0" && $codeValue eq "";
   }
   elsif ($type eq "SFTime")
   {
      return if $value eq "0" && $codeValue eq "";
      return if $value eq $codeValue;
   }
   elsif ($type =~ /^(?:SFVec2d|SFVec2f)$/)
   {
      $value =~s /(\s)/,$1/sgo;

      return if $value eq "0, 0" && $codeValue eq "";
      return if $value eq $codeValue;
   }
   elsif ($type =~ /^(?:SFVec3d|SFVec3f)$/)
   {
      $value =~s /(\s)/,$1/sgo;

      return if $value eq "0, 0, 0" && $codeValue eq "";
      return if $value eq $codeValue;
   }
   elsif ($type =~ /^(?:SFVec4d|SFVec4f)$/)
   {
      $value =~s /(\s)/,$1/sgo;

      return if $value eq "0, 0, 0, 0" && $codeValue eq "";
      return if $value eq $codeValue;
   }
   elsif ($type eq "MFBool")
   {
      return if $value eq "[ ]" && $codeValue eq "";
   }
   elsif ($type eq "MFColor")
   {
      return if $value eq "[ ]" && $codeValue eq "";
      return if $value eq "0 0 0" && $codeValue eq "new Fields .SFColor ()";
   }
   elsif ($type eq "MFColorRGBA")
   {
      return if $value eq "[ ]" && $codeValue eq "";
   }
   elsif ($type eq "MFDouble")
   {
      return if $value eq "[ ]" && $codeValue eq "";
      return if $value eq "[ 0, 0 ]" && $codeValue eq "0, 0";
   }
   elsif ($type eq "MFFloat")
   {
      return if $value eq "[ ]" && $codeValue eq "";
      return if $value eq "[ $codeValue ]";
   }
   elsif ($type eq "MFImage")
   {
      return if $value eq "[ ]" && $codeValue eq "";
   }
   elsif ($type eq "MFInt32")
   {
      return if $value eq "[ ]" && $codeValue eq "";
      return if $value eq "[ $codeValue ]";
      return if $value =~ /^[+-]?\d+$/ && $value eq $codeValue;
   }
   elsif ($type =~ /^(?:MFMatrix3d|MFMatrix3f)$/)
   {
      return if $value eq "[ ]" && $codeValue eq "";
   }
   elsif ($type =~ /^(?:MFMatrix4d|MFMatrix4f)$/)
   {
      return if $value eq "[ ]" && $codeValue eq "";
   }
   elsif ($type eq "MFNode")
   {
      return if $value eq "[ ]" && $codeValue eq "";
   }
   elsif ($type eq "MFRotation")
   {
      return if $value eq "[ ]" && $codeValue eq "";
      return if $value eq "0 0 1 0" && $codeValue eq "new Rotation4 ()";
   }
   elsif ($type eq "MFString")
   {
      return if $value eq "[ ]" && $codeValue eq "";
      return if $value eq "[ $codeValue ]";
      return if $value =~ /^"\w+"+$/ && $value eq $codeValue;
   }
   elsif ($type eq "MFTime")
   {
      return if $value eq "[ ]" && $codeValue eq "";
   }
   elsif ($type =~ /^(?:MFVec2d|MFVec2f)$/)
   {
      return if $value eq "[ ]" && $codeValue eq "";
      return if $value eq "[ 1 1, 1 -1, -1 -1, -1 1, 1 1 ]" && $codeValue eq "new Vector2 (1, 1), new Vector2 (1, -1), new Vector2 (-1, -1), new Vector2 (-1, 1), new Vector2 (1, 1)";
      return if $value eq "1 1" && $codeValue eq "new Vector2 (1, 1)";
   }
   elsif ($type =~ /^(?:MFVec3d|MFVec3f)$/)
   {
      return if $value eq "[ ]" && $codeValue eq "";
      return if $value eq "0 0 0" && $codeValue eq "new Vector3 (0, 0, 0)";
      return if $value eq "[ 0 0 0, 0 1 0 ]" && $codeValue eq "new Vector3 (0, 0, 0), new Vector3 (0, 1, 0)";
   }
   elsif ($type =~ /^(?:MFVec4d|MFVec4f)$/)
   {
      return if $value eq "[ ]" && $codeValue eq "";
   }
   else
   {
      return;
   }

   say "$typeName $name '$value' <-> '$codeValue'";
}

node $_ foreach sort `find ../x_ite/src/x_ite/Components -type f -mindepth 2`;
