# Filter and Zoom

This widget reads the URL parameters, gets the extent of the filtered features from the given data source and zooms in on them.

## Example

```
https://<exb_path>/experience/<app_id>/?data_filter=<dataSource_id>:<whereClause>
```

It is recommended to use the Filter widget to define an expression and look at the app config. The ``dataSource_id`` might be long and hard to find out otherwise, especially if the query refers to a layer within a WebMap, that has been imported as a data source.
Here is a shortened example entry from ``config.json``, defining the Filter widget:

``` json
"widget_2": {
    "uri": "widgets/common/filter/",
    "version": "1.14.0",
    "label": "Filter",
    "config": {
...
        "filterItems": [
            {
...
            "useDataSources": [
                {
                "dataSourceId": "dataSource_1-b2238a56a6c648bc9edc5e66892aca1f",
                "mainDataSourceId": "dataSource_1-b2238a56a6c648bc9edc5e66892aca1f",
                "rootDataSourceId": "dataSource_1",
                "fields": [
                    "FA_NR"
                ]
                }
            ],
...
            "sqlExprObj": {
...
                "sql": "((FA_NR = 1154))",
...
                }
            }
        ]
      },
...
    },
```

resulting in the following sequence of URL parameters:

```
https://<exb_path>/experience/<app_id>/?data_filter=dataSource_1-b2238a56a6c648bc9edc5e66892aca1f:FA_NR=1164
```



## How to use the sample
Clone the sample repo into your Experience Builder Client root folder and restart your watcher.

## How it works
Look at the code :)
