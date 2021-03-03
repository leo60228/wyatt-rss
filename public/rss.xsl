<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:template name="format-from-rfc-to-iso">
        <xsl:param name="rfc-date" />
        <xsl:param name="day-with-zero" select="format-number(substring(substring($rfc-date, 6, 11), 1, 2), '00')" />
        <xsl:param name="month-with-zero">
            <xsl:if test="contains($rfc-date, 'Jan')">01</xsl:if>
            <xsl:if test="contains($rfc-date, 'Feb')">02</xsl:if>
            <xsl:if test="contains($rfc-date, 'Mar')">03</xsl:if>
            <xsl:if test="contains($rfc-date, 'Apr')">04</xsl:if>
            <xsl:if test="contains($rfc-date, 'May')">05</xsl:if>
            <xsl:if test="contains($rfc-date, 'Jun')">06</xsl:if>
            <xsl:if test="contains($rfc-date, 'Jul')">07</xsl:if>
            <xsl:if test="contains($rfc-date, 'Aug')">08</xsl:if>
            <xsl:if test="contains($rfc-date, 'Sep')">09</xsl:if>
            <xsl:if test="contains($rfc-date, 'Oct')">10</xsl:if>
            <xsl:if test="contains($rfc-date, 'Nov')">11</xsl:if>
            <xsl:if test="contains($rfc-date, 'Dec')">12</xsl:if>
        </xsl:param>
        <xsl:param name="year-full" select="format-number(substring(substring($rfc-date, 6, 11), 7, 5), '####')" />
        <xsl:param name="time" select="substring($rfc-date, 18, 8)" />
        <xsl:param name="rfc-date-to-iso" select="concat($year-full, '-', $month-with-zero, '-', $day-with-zero, 'T', $time, 'Z')" />

        <xsl:value-of select="$rfc-date-to-iso" />
    </xsl:template>

    <xsl:output method="html" doctype-system="about:legacy-compat" indent="yes" />
    <xsl:template match="/rss/channel">
        <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />

                <title>
                    <xsl:value-of select="title" />
                </title>

                <script type="module" src="https://unpkg.com/@github/time-elements@3.1.1/dist/time-elements.js"></script>
            </head>
            <body>
                <h1>
                    <xsl:value-of select="title" />
                </h1>

                <p>
                    <xsl:value-of select="description" />
                </p>

                <ul>
                    <xsl:for-each select="./item">
                        <li>
                            <local-time month="long" day="numeric" year="numeric" hour="numeric" minute="2-digit">
                                <xsl:attribute name="datetime">
                                    <xsl:call-template name="format-from-rfc-to-iso">
                                        <xsl:with-param name="rfc-date" select="pubDate" />
                                    </xsl:call-template>
                                </xsl:attribute>
                                <xsl:value-of select="pubDate" />
                            </local-time>: <xsl:value-of select="description" />
                        </li>
                    </xsl:for-each>
                </ul>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
