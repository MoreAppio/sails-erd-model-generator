<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit07b838a38b773f7de930088ceb419e53
{
    public static $prefixLengthsPsr4 = array (
        'M' => 
        array (
            'MwbExporter\\Formatter\\Node\\' => 27,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'MwbExporter\\Formatter\\Node\\' => 
        array (
            0 => __DIR__ . '/..' . '/mysql-workbench-schema-exporter/node-exporter/lib/MwbExporter/Formatter/Node',
        ),
    );

    public static $prefixesPsr0 = array (
        'M' => 
        array (
            'MwbExporter\\' => 
            array (
                0 => __DIR__ . '/..' . '/mysql-workbench-schema-exporter/mysql-workbench-schema-exporter/lib',
            ),
        ),
        'D' => 
        array (
            'Doctrine\\Common\\Inflector\\' => 
            array (
                0 => __DIR__ . '/..' . '/doctrine/inflector/lib',
            ),
        ),
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInit07b838a38b773f7de930088ceb419e53::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInit07b838a38b773f7de930088ceb419e53::$prefixDirsPsr4;
            $loader->prefixesPsr0 = ComposerStaticInit07b838a38b773f7de930088ceb419e53::$prefixesPsr0;

        }, null, ClassLoader::class);
    }
}
