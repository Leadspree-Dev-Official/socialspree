import os
import urllib.request

output_dir = "/Users/aniruddhadas/Ani/Coding Projects/Google Antigravity/Development Products/SaaS/SocialSpree/stitch_assets"
os.makedirs(output_dir, exist_ok=True)

screens = [
    {
        "id": "75b5b7cb842b4766aeb3397cfb69dcda",
        "name": "01_google_reviews_desktop",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLuYYad43bmvg4Q8JJyPu9d4_dn2M7TW9sZ536F08_0-WabJT3UHXYnCY3e_u6BjTYowFf5G8W8_rkGojdQ_tmSq9xwnpyTinpz7FbhknNVLW_3p-84kQdTzgpDYXEBQ-8wRR7JI6dUA8i33WA12bs34PE6ngMtMpgDg16Yj6UcLPbqwFd-7AoAEu_HSgHgbiz3ks0DiNtUTVN12bU2MMk92a2pxMCGi8nlQpUn0xdol3SOVFJiZsVww34QQ",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4NjcwNzAxNmUwMjJkNjllMzBkMjMwMjRmEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "23847904bb864afc9f4ecb5dd53375d1",
        "name": "02_analytics_dashboard_desktop",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLsCth-3BCup2fmJEPnJ8vRBCop8zYtLeoN7qNJ7wBKV4kc94aeIl_WTBzPBvfo3qrD2fS7lMm1m0jDU5-TxHBlvgpQPaKdyT3UD9sOaFGFXoJu6UC-ieVBgiDlGtb1de5kw7FnCuZhFebkvJ9fpjCJlErHXIhTvGuePZj2Rqlx9LmCRLnKAzaolBvVDkRgvC9xiraVGi2Y7co54UKBDayT62IGn7cBFgBfFQtU0t7IsEb1RVBkEyowE7Q0q",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4MjU2YjcyYWQwMWE2MmRlM2E5MjYxNjkzEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "7d3e6dc52dcf441c9d2be74118ae9819",
        "name": "03_social_connections",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLsZKKbRJaE9Y1vZmo8HMzym4Y47OfBrdpX2_L85QVaHswdCv_e99K7xfnyi9zr3uEmGe2I7AkcUL2XYbzT7KXSeS5km3bjbgaA31QLeNuXw-y9n5J8O1TjsFO9eeHYnI8ewIcRWYkbw-NovL8SU25c25NRLksem4xf_-a2U9IlZ_oDnDKTSg1Zm38pykkZksmY7lfuN_amOZv-PdnN8pSMjtsueLxH1RSE7e8t7_cWzvKipeG5YydkhcFdB",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4MjViNGE4YzMwMzM4NGNkZWVjMTQyYmZiEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "9334e634fd1941b3bc406e242aa00361",
        "name": "04_post_composer_reordered",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLsSQgj9wr_GyJo7sm8ySYkkgE2-676_9MpHh_uU2-6LG8aHvTSvArGL0rLD56TUVYUDgDM6SxU1Y0Ow4fTq9CJeOZQiNy2GvWl25fwKNFojFjUR7G-UuHY0XXE9tzEpETK1BgyA4B9sPO6E2tQVwczmvXVd2PlGb5cD9FZc648_JUejVzjsCxYNrMtPpjxMGjd6DWUFKipuk7nZcZikvYvGKcgX6PIdUI8NJ9GS21VUki7Ml5KX0G2FawPT",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4MjUzYmJiZjcwN2M0YzE5NTEyMzAzZGYxEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "bb70574928ac4467b5cae9a2acd817cf",
        "name": "05_dashboard_overview",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLtWYs_j_lZZf7yirzyDYJ6ofjCVk_hgVvenC9Vfkvc1mapkgrtk5VDK6LEglH0GJomFHtl9egO5vVjlYLWUyJ0BtlS7l_kSpH4ZVt523ALCx3cCDzUmYLYA-LocD6ZPGj_jtfWDFtT5j7BSAfB5S-2ggWbmMiVsaiCHGXX6GRS3TU2gZibYv2GPB5FCte-iJDIkFStxgJEusgKQugmE3I8Wr3MYtvg2sxW4ShO0SJHxfespZHPMgxl1BHc",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4NDQ1NjhkNDQwOTI1ZDQyZjc0MTA4MDM3EgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "8867a6b480db49738d8fd8ffaf93d804",
        "name": "06_post_logs_audit_trail",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLsMjOzTt9coc257QSYHiFKUaCZ5BmwshUEKWKfB5EBUEjiswcui_J6KMolSt5s47e6N25-a2-aaadHHPuuXRmESmV0L_jtpUO0Lb3uVaZrlMNbq63f376UlfZ4G3w3XQ2N2ZiDKTuydfglpHdUKENzHExzac6IIaR2-yd4CcWSaNOe9amvVnBtaaDqaYIQM5B_RAQV75ryJOeH7Pqfo96UpTWETkd7FE10EBMH_TgBWtXixSBGrZHzA7xH5",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4MzUxMmM5ZWMwMWE2MmYzNzQzMzk0MGU3EgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "896a3c92c1c646418ed4a23056e984b5",
        "name": "08_google_reviews_mobile",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLt6Rvx9Cc4b75STAcB56sEwkniv5g5yoeRpSWUQHNCozHfXRxbz2DG1RcBYZ-ygPjVWHqo2OFu50Y3fjwD0lqD_sRRV6MWeBuzOdDqU7KVncSnq5wPxSSWyXVn8i00XEW4stIt-SllnaYs97BIEB-5wdXIfNvSQHosYVoRXEOheL_ZDcVftT627nBfl2snQcY46iJRrVu2vocpyRThxb5z14WJeg_zXRQmOSjtij8HIiJ0M2-mm8R3xMZ4t",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4NDQ5MDgyODAwOTI1Yzc5OGZiMTkwZWEyEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "146224503ef941d4b7d696c6b82fedbf",
        "name": "09_social_connections_mobile",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLuyT5XwODc4mykCw45b5XzOv-RYOubopiAzQ3ALCUquTCTADpZLmC0jUqCCH04oInhCbAOanVSb0rq0USG67FJcC1HBzi4dnM1TFPyV8zbclF7gWiKk0fNfhIkBAeBTOHCBJ0OLPmRA2ymJs8T-336iYiqIpFpvIAVaoqiP9wvB0HP9I34IBE2P9qQ8yGHgS8y-bFwa--SIrodqyICCKe1cmI5CAEYhH5f9Y6AxUoYNvc5NsqWpIWnOTgHy",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4MjRiOGE1YzMwN2U4NDJiMTk5MjYzNWUzEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "16080ce3845d4077a581a826f2d8277e",
        "name": "10_dashboard_overview_mobile",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLv7MDdohR36DVdWUCWMOt_o2t9jSQjDC9UwrQolhaot_rh64P6aoudcmT783-0mauIoUqzDeHQ2ZbqZlq36ami0ic9kB12th_-PXwBq9JUGbgIYmLXWKPov44w_e-JCFTAtilsbPe2-T81U5SH76Yb4BMRGhGwCPFO_5jjrtQliHvSwkn9ppeF2lf8Auq4dvBhd3o4fAS6dojMi_iIcTSyya1BxtBOxPVJrWTBWe48iPgbuUA04nVtVdgk",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4NDNjNTM2NzgwMmQzZDFkMGQ1MzRmYTI4EgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "3f0f38e2d6e44f7995e8c1995b812ab5",
        "name": "11_analytics_dashboard_mobile",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLtho1LACRHR5Tv1-IdFVklwyr-YYBcHTsD3e8CuK09KZetoIWJ004wyuwwK7NEbP66vq7SiLPANMouvFq7pLd6oqIyywZiH1HPwJZfw8I_djqMxeJ61Qthndlo7EACbDdVjbARmox3iLUdCniPl7Uw1wqdx-6tMGPvaP4cXx2trJ26h_40mrAOLIt6LCIW4qWAEu0pNjO_RCiBMC8tfYPJO106VX4aibrTS7n1uAx6_BvaWcdmY418K-aKO",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4MjU5MjM0MzUwOTI1Yzc5OGZiMTkwZWEyEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "7245fc206bc54343a77328266279fa27",
        "name": "12_activity_logs_mobile",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLv1oPqcMY9zIzLpjdNlAAaW9MFu5J44PSfe4QW9LhLTVNNotyhlHYkK8dcywAj7sfB2o-Mv9HgsEvSuk86ybln5xpyObS3SgrU1iRdvoMb462J7EfIP_BMpJYjQJznBaoMqINTlVvweKeQZAHi7N0EJJhX_bQF-F8EKG-gZ3QrCXEIQGYdiUWVXL6Hw3VBlbGPxgmcZ-eYVaIgwoj6D6fGTttNAADQY0SFMWF7Yo2X0Ip28P0_o13a9tqZo",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4MjUxYTFiMTYwNTNiNmFhYmM1MmRmYmJjEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    },
    {
        "id": "ba83f70a5ffb4ab7b963c3836b0b62ff",
        "name": "13_post_composer_mobile",
        "img": "https://lh3.googleusercontent.com/aida/AP1WRLuSh13cBU_X8RY3qEMWKc6XD1BTOkHXMjc-KHP0R3rw-X775tZAMKNBFP8lTlVXPKrgq2KpVbh8QGmS6YFUTzFPIo3v631a0OPcZNV4oIKWHoj-bcBn6_RCCaCnLH2biB28FyeSoBDXCaYW1PIpizGKIJMgZwxOxetUGB0OxkjwsNRARZGa7a0nNAv_r452I5je2zXKqBiJJKeM2jv4EOnkYVs0DJu-OaFsQOCbpuLYDEG13HzdFx4iIMc",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1N2I4MjUwNzg5MTAwNDMxMTY5ZGQ4MzVkNzRjEgsSBxC3naO8jxIYAZIBJAoKcHJvamVjdF9pZBIWQhQxODQxMTUyNzUzMzI3NDgwNjAyMg&filename=&opi=89354086"
    }
]

headers = {'User-Agent': 'Mozilla/5.0'}

for s in screens:
    img_path = os.path.join(output_dir, f"{s['name']}.png")
    html_path = os.path.join(output_dir, f"{s['name']}.html")
    
    print(f"Downloading {s['name']} image...")
    req = urllib.request.Request(s['img'], headers=headers)
    try:
        with urllib.request.urlopen(req) as resp, open(img_path, 'wb') as out_f:
            out_f.write(resp.read())
    except Exception as e:
        print(f"Failed img {s['name']}: {e}")

    print(f"Downloading {s['name']} html...")
    req = urllib.request.Request(s['html'], headers=headers)
    try:
        with urllib.request.urlopen(req) as resp, open(html_path, 'wb') as out_f:
            out_f.write(resp.read())
    except Exception as e:
        print(f"Failed html {s['name']}: {e}")

print("All downloads complete!")
