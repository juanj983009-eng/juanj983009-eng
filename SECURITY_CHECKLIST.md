# Security checklist

Scope: this profile README and its local SVG assets. Last reviewed: 2026-11-19.

| Control | Estado | Evidencia / siguiente paso |
| --- | --- | --- |
| No obvious credential material in the changed profile files | Aprobado | Searched README and SVGs for common private-key headers, GitHub token prefixes and quoted password/secret/token assignments; no matches. This is not an exhaustive secret scan. |
| SVGs contain no scripts, external resources or embedded HTML | Aprobado | XML parsing and element/attribute inspection of all twenty-four SVGs; assets use inline vector shapes, text, styles and declarative animation only. |
| Local SVG image paths | Aprobado | All twenty-four SVGs reside in `assets/` and local README image paths exist. |
| External profile view counter | Pendiente | The README uses Komarev for a counter; availability and counts depend on that third party and GitHub image caching. It counts requests, not unique visitors. |
| External destination links | Pendiente | Three GitHub project repositories and the portfolio were reachable. LinkedIn redirected to a sign-in wall, so the profile could not be confirmed. Email delivery was not tested. |
| GitHub branch protection and repository settings | Pendiente | Not assessed. |
| Authentication, authorization, database and server controls | No aplica | This repository contains static profile content and no application backend. |
| Full history secret scan | Pendiente | Only the current changed profile files were searched; repository history was not scanned. || Animated portrait source and embedding | Aprobado | The owner selected their public GitHub avatar; the SVG contains locally generated vector paths, with no external image reference. |
| Animation and small-screen readability | Pendiente | Static preview was inspected; GitHub rendering, animation behavior and mobile readability require in-browser verification. |


| Automated statistics permissions | Aprobado | Workflow scopes GITHUB_TOKEN to contents: write, pins checkout to a commit and stages only assets/github-public-stats.svg; it uses the public GitHub API. |
| Statistics workflow execution | Aprobado | [Run 44461160959](https://github.com/juanj983009-eng/juanj983009-eng/actions/runs/44461160959) completed successfully, including API generation and commit step. |

| Animated data pipeline | Pendiente | XML, local image references and a static preview are checked; animation and mobile readability need verification in GitHub. |
